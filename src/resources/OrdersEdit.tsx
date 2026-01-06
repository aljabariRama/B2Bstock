import { Edit, SimpleForm, ArrayInput, SimpleFormIterator, NumberInput, SelectInput } from "react-admin";
import { PRODUCTS } from "../productsCatalog";

export default function OrdersEdit() {
  return (
    <Edit>
      <SimpleForm>
        <ArrayInput source="items">
          <SimpleFormIterator inline>
            <SelectInput
              source="productId"
              choices={PRODUCTS.map((p) => ({ id: p.productId, name: `${p.productId} - ${p.name}` }))}
            />
            <NumberInput source="quantity" />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Edit>
  );
}
