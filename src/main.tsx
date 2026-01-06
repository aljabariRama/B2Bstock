import React from "react";
import ReactDOM from "react-dom/client";
import { Admin, Resource } from "react-admin";
import MyLayout from "./MyLayout";
import { theme } from "./theme";
import { dataProvider } from "./dataProvider";

import Dashboard from "./pages/Dashboard";
import CompanySetupPage from "./pages/CompanySetup";
import StockPage from "./resources/StockPage";
import OrdersList from "./resources/OrdersList";
import OrdersCreate from "./resources/OrdersCreate";
import OrdersEdit from "./resources/OrdersEdit";

import { HashRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/company-setup" element={<CompanySetupPage />} />
        <Route
          path="/*"
          element={
            <Admin
              dataProvider={dataProvider}
              layout={MyLayout}
              dashboard={Dashboard}
              theme={theme}
            >
              <Resource name="stock" list={StockPage} />
              <Resource name="orders" list={OrdersList} create={OrdersCreate} edit={OrdersEdit} />
            </Admin>
          }
        />
      </Routes>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
