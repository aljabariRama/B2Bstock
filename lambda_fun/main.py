import os, uuid
from datetime import datetime
from typing import List, Optional, Dict

import boto3
from boto3.dynamodb.conditions import Key
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from mangum import Mangum
from pydantic import EmailStr

# enviroment var
INVENTORY_TABLE = os.environ["INVENTORY_TABLE"]
ORDERS_TABLE = os.environ["ORDERS_TABLE"]
LOW_STOCK_TOPIC_ARN = os.environ.get("LOW_STOCK_TOPIC_ARN", "")


ddb = boto3.resource("dynamodb")
inventory = ddb.Table(INVENTORY_TABLE)
orders = ddb.Table(ORDERS_TABLE)
ddb_client = boto3.client("dynamodb")
sns = boto3.client("sns")


app = FastAPI(title="B2B Stock")


def now() -> str:
    return datetime.utcnow().isoformat() + "Z"

# request body 
class StockUpsert(BaseModel):
    productId: str
    name: Optional[str] = ""
    qtyAvailable: int = 0
    lowThreshold: int = 0

class StockAdd(BaseModel):
    amount: int

class OrderItem(BaseModel):
    productId: str = Field(..., min_length=1) 
    quantity: int = Field(..., gt=0, le=10000)

class CreateOrderReq(BaseModel):
    companyId: str
    items: List[OrderItem]

class UpdateOrderReq(BaseModel):
 companyId: str = Field(..., min_length=1)
 companyName: str = Field(..., min_length=2) 
 email: EmailStr 
region: str = Field(..., min_length=2) 
items: List[OrderItem]



#Data Retrieva functions 
def key_inv(companyId: str, productId: str) -> Dict:
    return {
        "companyId": {"S": companyId},
        "productId": {"S": productId}  }

def get_order(companyId: str, orderId: str) -> dict:
    r = orders.get_item(Key={"companyId": companyId, "orderId": orderId})
    item = r.get("Item")
    if not item:
        raise HTTPException(404, "Order not found")
    return item

def get_stock(companyId: str, productId: str) -> dict:
    r = inventory.get_item(Key={"companyId": companyId, "productId": productId})
    return r.get("Item") or {}


#Data Transformation

def normalize_items(items: List[OrderItem]) -> Dict[str, int]:
    merged: Dict[str, int] = {}

    for it in items:
        pid = it.productId.strip()
        if not pid:
            raise HTTPException(400, "productId cannot be empty")
        q = int(it.quantity)
       
        merged[pid] = merged.get(pid, 0) + q
    if not merged:
        raise HTTPException(400, "items cannot be empty")
    return merged




def items_to_list(merged: Dict[str, int]) -> List[dict]:
    return [{"productId": pid, "quantity": qty} for pid, qty in merged.items()]

def order_items_map(order_item: dict) -> Dict[str, int]:
    merged: Dict[str, int] = {}
    for it in order_item.get("items", []):
        pid = str(it["productId"])
        qty = int(it["quantity"])
        merged[pid] = merged.get(pid, 0) + qty
    return merged






def compute_delta(old: Dict[str, int], new: Dict[str, int]) -> Dict[str, int]:
    # delta = new - old
    delta = {}
    keys = set(old.keys()) | set(new.keys())
    for k in keys:
        d = int(new.get(k, 0)) - int(old.get(k, 0))
        if d != 0:
            delta[k] = d
    return delta





def is_low_stock(stock_item: dict) -> bool:
    if not stock_item:
        return False
    qty = int(stock_item.get("qtyAvailable", 0))
    thr = int(stock_item.get("lowThreshold", 0))
    return thr > 0 and qty <= thr

def publish_low_stock(companyId: str, productId: str, stock_item: dict, reason: str):
    if not LOW_STOCK_TOPIC_ARN:
        return
    qty = int(stock_item.get("qtyAvailable", 0))
    thr = int(stock_item.get("lowThreshold", 0))
    name = stock_item.get("name", "")

    sns.publish(
        TopicArn=LOW_STOCK_TOPIC_ARN,
        Subject="Low Stock Alert",
        Message=(
            f"LOW STOCK ALERT\n"
            f"Company: {companyId}\n"
            f"Product: {productId}\n"
            f"Name: {name}\n"
            f"qtyAvailable: {qty}\n"
            f"lowThreshold: {thr}\n"
            f"Reason: {reason}\n"
            f"Time: {now()}\n"
        ),
    )

def notify_if_low(companyId: str, productIds: List[str], reason: str):
    for pid in productIds:
        stock_item = get_stock(companyId, pid)
        if is_low_stock(stock_item):
            publish_low_stock(companyId, pid, stock_item, reason)





#stock is per companyId + productId

@app.get("/stock/{companyId}")
def list_company_stock(companyId: str):
    r = inventory.query(
        KeyConditionExpression=Key("companyId").eq(companyId),
        ScanIndexForward=True,
    )
    return {"items": r.get("Items", [])}





@app.post("/stock/{companyId}", status_code=201)
def upsert_stock(companyId: str, s: StockUpsert):
    item = {
        "companyId": companyId,
        "productId": s.productId,
        "name": s.name or "",
        "qtyAvailable": int(s.qtyAvailable),
        "lowThreshold": int(s.lowThreshold),
        "updatedAt": now() }
    inventory.put_item(Item=item)

 
    if is_low_stock(item):
        publish_low_stock(companyId, s.productId, item, reason="Stock upsert")

    return item









@app.post("/stock/{companyId}/{productId}/add")
def add_stock(companyId: str, productId: str, req: StockAdd):
    amt = int(req.amount)
    if amt == 0:
        raise HTTPException(400, "amount must be non-zero")

    r = inventory.update_item(
        Key={"companyId": companyId, "productId": productId},
        UpdateExpression="SET updatedAt = :u ADD qtyAvailable :a",
        ExpressionAttributeValues={":u": now(), ":a": amt},
        ConditionExpression="attribute_exists(companyId) AND attribute_exists(productId)",
        ReturnValues="ALL_NEW",
    )

    updated = r["Attributes"]


    if is_low_stock(updated):
        publish_low_stock(companyId, productId, updated, reason="Stock changed via /add")

    return {"ok": True, "stock": updated}


#

@app.post("/orders", status_code=201)
def create_order(req: CreateOrderReq):
    companyId = req.companyId.strip()
    merged = normalize_items(req.items)
    orderId = f"{uuid.uuid4()}"
    t = now()

    transact = []


    for productId, qty in merged.items():
        transact.append({
            "Update": {
                "TableName": INVENTORY_TABLE,
                "Key": key_inv(companyId, productId),
                "UpdateExpression": "SET updatedAt = :u ADD qtyAvailable :neg",
                "ConditionExpression": (
                    "attribute_exists(companyId) AND attribute_exists(productId) "
                    "AND qtyAvailable >= :need"
                ),
                "ExpressionAttributeValues": {
                    ":u": {"S": t},
                    ":neg": {"N": str(-qty)},
                    ":need": {"N": str(qty)}}}})

    order_item = {
        "companyId": {"S": companyId},
        "orderId": {"S": orderId},
        "companyName": {"S": req.companyName}, 
        "email": {"S": req.email},            
        "region": {"S": req.region},
        "items": {
            "L": [
                {"M": {"productId": {"S": pid}, "quantity": {"N": str(q)}}}
                for pid, q in merged.items()]},
                "createdAt": {"S": t},"updatedAt": {"S": t}}

    transact.append({
        "Put": {
            "TableName": ORDERS_TABLE,
            "Item": order_item,
            "ConditionExpression": "attribute_not_exists(companyId) AND attribute_not_exists(orderId)"}})

    ddb_client.transact_write_items(TransactItems=transact)

  
    notify_if_low(companyId, list(merged.keys()), reason=f"Order created {orderId}")

    return {
        "companyId": companyId,
        "orderId": orderId,
        "items": items_to_list(merged),
        "createdAt": t,
        "updatedAt": t,
    }






@app.get("/orders/company/{companyId}")
def list_company_orders(companyId: str):
    r = orders.query(
        KeyConditionExpression=Key("companyId").eq(companyId),
        ScanIndexForward=False )
    return {"items": r.get("Items", [])}




@app.get("/orders/{companyId}/{orderId}")
def read_order(companyId: str, orderId: str):
    return get_order(companyId, orderId)




@app.patch("/orders/{companyId}/{orderId}")
def update_order(companyId: str, orderId: str, req: UpdateOrderReq):
    companyId = companyId.strip()
    new_merged = normalize_items(req.items)

    old_order = get_order(companyId, orderId)
    old_merged = order_items_map(old_order)
    delta = compute_delta(old_merged, new_merged)
    t = now()
    transact = []

    
    for productId, d in delta.items():
        if d > 0:
            transact.append({
                "Update": {
                    "TableName": INVENTORY_TABLE,
                    "Key": key_inv(companyId, productId),
                    "UpdateExpression": "SET updatedAt = :u ADD qtyAvailable :neg",
                    "ConditionExpression": (
                        "attribute_exists(companyId) AND attribute_exists(productId) "
                        "AND qtyAvailable >= :need"),
                    "ExpressionAttributeValues": {
                        ":u": {"S": t},
                        ":neg": {"N": str(-d)},
                        ":need": {"N": str(d)}}}})
        else:
            add_back = -d
            transact.append({
                "Update": {
                    "TableName": INVENTORY_TABLE,
                    "Key": key_inv(companyId, productId),
                    "UpdateExpression": "SET updatedAt = :u ADD qtyAvailable :pos",
                    "ConditionExpression": "attribute_exists(companyId) AND attribute_exists(productId)",
                    "ExpressionAttributeValues": {
                        ":u": {"S": t},
                        ":pos": {"N": str(add_back)}}}})

    
    new_items_attr = {
        "L": [
            {"M": {"productId": {"S": pid}, "quantity": {"N": str(q)}}}
            for pid, q in new_merged.items()]}

    transact.append({
        "Update": {
            "TableName": ORDERS_TABLE,
            "Key": {"companyId": {"S": companyId}, "orderId": {"S": orderId}},
            "UpdateExpression": "SET #it = :items, updatedAt = :u",
            "ExpressionAttributeNames": {"#it": "items"},
            "ExpressionAttributeValues": {":items": new_items_attr, ":u": {"S": t}},
            "ConditionExpression": "attribute_exists(companyId) AND attribute_exists(orderId)"}})

    ddb_client.transact_write_items(TransactItems=transact)



    notify_if_low(companyId, list(delta.keys()), reason=f"Order updated {orderId}")

    return {
        "ok": True,
        "companyId": companyId,
        "orderId": orderId,
        "items": items_to_list(new_merged),
        "updatedAt": t}










@app.delete("/orders/{companyId}/{orderId}")
def delete_order(companyId: str, orderId: str):
    companyId = companyId.strip()
    old_order = get_order(companyId, orderId)
    old_merged = order_items_map(old_order)
    t = now()

    transact = []

    for productId, qty in old_merged.items():
        transact.append({
            "Update": {
                "TableName": INVENTORY_TABLE,
                "Key": key_inv(companyId, productId),
                "UpdateExpression": "SET updatedAt = :u ADD qtyAvailable :pos",
                "ConditionExpression": "attribute_exists(companyId) AND attribute_exists(productId)",
                "ExpressionAttributeValues": {
                    ":u": {"S": t},
                    ":pos": {"N": str(qty)}}}})
        


    transact.append({
        "Delete": {
            "TableName": ORDERS_TABLE,
            "Key": {"companyId": {"S": companyId}, "orderId": {"S": orderId}},
            "ConditionExpression": "attribute_exists(companyId) AND attribute_exists(orderId)"}})

    ddb_client.transact_write_items(TransactItems=transact)

    return {"ok": True, "deleted": {"companyId": companyId, "orderId": orderId}}






handler = Mangum(app)
