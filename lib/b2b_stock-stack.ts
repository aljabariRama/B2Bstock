import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path" ;
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as apigw from "aws-cdk-lib/aws-apigateway";
 


export class B2BStockStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
   //DynamoDB table
    
  const inventoryTable = new dynamodb.Table(this, "InventoryTable", {
  partitionKey: { name: "companyId", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "productId", type: dynamodb.AttributeType.STRING }});




   const ordersTable = new dynamodb.Table(
    this , "OrdersTable", 
    {partitionKey:{name :"companyId" , type:dynamodb.AttributeType.STRING},
     sortKey:{name:"orderId", type:dynamodb.AttributeType.STRING}});
  

     
    //SNS Topic 
   const  lowstocktopic = new sns.Topic(this , "Low_stock_alarm ",
    {displayName : "Low Stock Alerts "});
 
  // send to my email just for test 

   lowstocktopic.addSubscription(
    new subs.EmailSubscription("rama.aljabari@genelle.com"));

  //Lambdas  
    

    // env vars shared by lambda functions 
    const commonLambdaEnv = {
       INVENTORY_TABLE:inventoryTable.tableName,
       ORDERS_TABLE: ordersTable.tableName,
       LOW_STOCK_TOPIC_ARN: lowstocktopic.topicArn,
    };




   const lambdaDir = path.join(__dirname, "../lambda_fun");

    const handler = new lambda.Function(this, "B2BUnifiedHandler", {
      runtime: lambda.Runtime.PYTHON_3_10, // أو PYTHON_3_11
      handler: "main.handler",
      code: lambda.Code.fromAsset(lambdaDir, {
        bundling: {
          image: lambda.Runtime.PYTHON_3_10.bundlingImage,
          command: [
            "bash",
            "-lc",
            "pip install -r requirements.txt -t /asset-output && cp -r . /asset-output" ]}}),
        environment: {
        INVENTORY_TABLE: inventoryTable.tableName,
        ORDERS_TABLE: ordersTable.tableName,
        LOW_STOCK_TOPIC_ARN: lowstocktopic.topicArn,
      }});

     



//permissions 
   
        inventoryTable.grantReadWriteData(handler);
        ordersTable.grantReadWriteData(handler);
        lowstocktopic.grantPublish(handler);


   //API gateway (proxy serves)

   const api = new apigw.RestApi(this, "B2BstockApi", {
    deployOptions: { stageName: "v1" },
    defaultCorsPreflightOptions: {
    allowOrigins: apigw.Cors.ALL_ORIGINS,
    allowMethods: apigw.Cors.ALL_METHODS,
    allowHeaders: ["Content-Type", "Authorization"]}});



  api.root.addProxy({
  defaultIntegration: new apigw.LambdaIntegration(handler),
  anyMethod: true});
    

      new cdk.CfnOutput(this, "API_URL", { value: api.url });
  }
}
