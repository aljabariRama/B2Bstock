import type { DataProvider } from "react-admin";
import { requireCompany } from "./companyStore";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

async function readJsonOrThrow(res: Response, action: string) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${action} failed: ${res.status} - ${text}`);
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export const dataProvider: DataProvider = {
  async getList(resource) {
    const c = requireCompany();

    if (resource === "orders") {
      const res = await fetch(`${API_URL}/orders/company/${c.companyId}`);
      const json = await readJsonOrThrow(res, "getList(orders)");
      const items = (json.items || []).map((o: any) => ({
        ...o,
        id: o.orderId,
      }));
      return { data: items, total: items.length };
    }

    if (resource === "stock") {
      const res = await fetch(`${API_URL}/stock/${c.companyId}`);
      const json = await readJsonOrThrow(res, "getList(stock)");
      const items = (json.items || []).map((s: any) => ({
        ...s,
        id: s.productId,
      }));
      return { data: items, total: items.length };
    }

    throw new Error(`getList not implemented for ${resource}`);
  },

  async getOne(resource, params) {
    const c = requireCompany();

    if (resource === "orders") {
      const res = await fetch(`${API_URL}/orders/${c.companyId}/${params.id}`);
      const json = await readJsonOrThrow(res, "getOne(order)");
      return { data: { ...json, id: params.id } };
    }

    throw new Error(`getOne not implemented for ${resource}`);
  },

 async create(resource, params) {
  const c = requireCompany();

  if (resource === "orders") {
    const body = {
      companyId: c.companyId,
      companyName: c.companyName,
      email: c.email,
      region: c.region,
      items: (params.data?.items || []).map((it: any) => ({
        productId: String(it.productId),
        quantity: Number(it.quantity),
      })),
    };

    console.log("CREATE ORDER BODY:", JSON.stringify(body, null, 2));

    
    if (!body.items.length) {
      throw new Error("Please add at least one item before saving the order.");
    }
    for (const it of body.items) {
      if (!it.productId) throw new Error("productId is required.");
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
        throw new Error(`Invalid quantity for ${it.productId}.`);
      }
    }

   
    const stockRes = await fetch(`${API_URL}/stock/${c.companyId}`);
    const stockJson = await readJsonOrThrow(stockRes, "precheck(stock)");
    const stockItems = (stockJson.items || []) as any[];

    const stockMap = new Map(
      stockItems.map((s: any) => [String(s.productId), Number(s.qtyAvailable || 0)])
    );

    for (const it of body.items) {
      const available = stockMap.get(it.productId);
      if (available === undefined) {
        throw new Error(
          `Stock not initialized for ${it.productId}. Go to Stock → Initialize Stock first.`
        );
      }
      if (available < it.quantity) {
        throw new Error(
          `Not enough stock for ${it.productId}. Available: ${available}, requested: ${it.quantity}.`
        );
      }
    }

   
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log("CREATE ORDER RESPONSE:", res.status, text);

    if (!res.ok) throw new Error(`create(order) failed: ${res.status} - ${text}`);

    const json = text ? JSON.parse(text) : {};
    return { data: { ...json, id: json.orderId } };
  }

  throw new Error(`create not implemented for ${resource}`);
}

,

  async update(resource, params) {
    const c = requireCompany();

    if (resource === "orders") {
      
      const body = {
        companyId: c.companyId,
        companyName: c.companyName,
        email: c.email,
        region: c.region,
        items: (params.data?.items || []).map((it: any) => ({
          productId: String(it.productId),
          quantity: Number(it.quantity),
        })),
      };

      const res = await fetch(`${API_URL}/orders/${c.companyId}/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await readJsonOrThrow(res, "update(order)");
      return { data: { ...(params.data as any), ...(json as any), id: params.id } };
    }

    throw new Error(`update not implemented for ${resource}`);
  },

  async delete(resource, params) {
    const c = requireCompany();

    if (resource === "orders") {
      const res = await fetch(`${API_URL}/orders/${c.companyId}/${params.id}`, {
        method: "DELETE",
      });

      await readJsonOrThrow(res, "delete(order)");
      return { data: (params.previousData as any) ?? { id: params.id } };
    }

    throw new Error(`delete not implemented for ${resource}`);
  },

  
  getMany: async () => ({ data: [] }),
  getManyReference: async () => ({ data: [], total: 0 }),
  updateMany: async () => ({ data: [] }),
  deleteMany: async () => ({ data: [] }),
};
