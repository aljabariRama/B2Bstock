# 📦 B2B Inventory & Order Management System (Serverless)

An enterprise-grade B2B stock management and ordering API. This system ensures high data integrity using **DynamoDB Transactions** and provides real-time alerts via **Amazon SNS**.



## 🚀 Key Features
- **Atomic Order Processing:** Uses DynamoDB `TransactWriteItems` to ensure that stock levels are adjusted and orders are created as a single, indivisible operation (prevents overselling).
- **Serverless Architecture:** Built with **FastAPI** and **Mangum**, ready to be deployed on **AWS Lambda**.
- **Intelligent Stock Tracking:** Automatically calculates stock deltas during order updates (`PATCH`) to return or subtract inventory correctly.
- **Low Stock Alerts:** Integrated with **Amazon SNS** to notify managers when a product's quantity falls below a defined threshold.
- **Robust Validation:** Powered by **Pydantic** to enforce data types, positive quantities, and valid email formats.

## 🛠 Tech Stack
- **Backend:** Python 3.x, FastAPI, Pydantic.
- **AWS Services:** Lambda, DynamoDB, SNS, CDK (Infrastructure as Code).
- **DevOps:** Docker, Mangum (ASGI Adapter).
- **Documentation:** OpenAPI (Swagger) compatible.

## 🏗 Project Structure
```text
.
├── lambda_fun/
│   ├── main.py          # Core FastAPI application logic
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile       # Container definition for Lambda
├── lib/                 # AWS CDK Infrastructure code (TypeScript)
├── swagger/             # API Documentation (OpenAPI spec)
└── README.md