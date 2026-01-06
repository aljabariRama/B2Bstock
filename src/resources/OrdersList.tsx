import { List, Datagrid, TextField, DateField, EditButton, DeleteButton } from "react-admin";
import { Chip, Stack } from "@mui/material";

const ItemsChips = (props: any) => {
  const items = props.record?.items || [];
  return (
    <Stack direction="row" spacing={1}>
      {items.map((it: any, idx: number) => (
        <Chip key={idx} size="small" label={it.productId} />
      ))}
    </Stack>
  );
};

export default function OrdersList() {
  return (
    <List resource="orders">
      <Datagrid rowClick={false}>
        <TextField source="orderId" label="Order ID" />
        <TextField source="companyId" label="Company" />
        <DateField source="createdAt" label="Created at" />
        <DateField source="updatedAt" label="Updated at" />
        <ItemsChips label="Items" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
}
