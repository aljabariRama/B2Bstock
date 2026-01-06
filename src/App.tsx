import { Admin, Resource, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";

import MyLayout from "./MyLayout";
import { dataProvider } from "./dataProvider";

import CompanySetupPage from "./pages/CompanySetup";
import Dashboard from "./pages/Dashboard";

import OrdersList from "./resources/OrdersList";
import OrdersCreate from "./resources/OrdersCreate";
import OrdersEdit from "./resources/OrdersEdit";
import StockPage from "./resources/StockPage";

export default function App() {
  return (
    <Admin dataProvider={dataProvider} dashboard={Dashboard} layout={MyLayout}>
      <CustomRoutes>
        <Route path="/company-setup" element={<CompanySetupPage />} />
      </CustomRoutes>

      <Resource name="stock" list={StockPage} />
      <Resource name="orders" list={OrdersList} create={OrdersCreate} edit={OrdersEdit} />
    </Admin>
  );
}
