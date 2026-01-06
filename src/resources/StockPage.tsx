import React from "react";
import { List, useListContext, useRefresh } from "react-admin";
import {Box,Button,Card,CardContent,Typography,Table,TableHead,TableRow,TableCell,TableBody,Chip,Stack} from "@mui/material";
import InitializeStockModal from "./stock/InitializeStockModal";
import StockAdjustDialog from "./stock/StockAdjustDialog";
import { PRODUCTS } from "../productsCatalog";

function EmptyStock() {
  const [open, setOpen] = React.useState(false);
  const refresh = useRefresh();

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 900, textAlign: "center", mt: 4 }}
      >
        No stock yet
      </Typography>
      <Typography sx={{ textAlign: "center", opacity: 0.7, mb: 3 }}>
        Click the button below to add initial stock values.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="warning"
          sx={{ borderRadius: 3, fontWeight: 900, px: 4, py: 1.2 }}
          onClick={() => setOpen(true)}
        >
          Initialize Stock
        </Button>
      </Box>

      <InitializeStockModal
        open={open}
        onClose={() => setOpen(false)}
        onDone={() => {
          
          setOpen(false);
          refresh();
        }}
      />
    </Box>
  );
}

function StockBody() {
  const { data, isLoading } = useListContext();
  const refresh = useRefresh();

  const [adjust, setAdjust] = React.useState<{
    open: boolean;
    productId: string;
    mode: "add" | "remove";
  }>({ open: false, productId: "P1", mode: "add" });

  if (isLoading) return null;

  const items = (data || []) as any[];
  if (items.length === 0) return <EmptyStock />;

  const metaById = new Map(PRODUCTS.map((p) => [p.productId, p]));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
        Stock
      </Typography>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Product</b>
                </TableCell>
                <TableCell>
                  <b>Qty</b>
                </TableCell>
                <TableCell>
                  <b>Low Threshold</b>
                </TableCell>
                <TableCell align="right">
                  <b>Actions</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((s: any) => {
                const p = metaById.get(s.productId);
                return (
                  <TableRow key={s.productId}>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 3,
                            display: "grid",
                            placeItems: "center",
                            background: "#f2efe6",
                            border: "1px solid #e5e0d6",
                          }}
                        >
                          {p?.icon || "📦"}
                        </Box>

                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>
                            {p?.name || s.name || s.productId}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.6 }}>
                            <Chip size="small" label={`ID: ${s.productId}`} />
                            <Chip
                              size="small"
                              label={p?.tag || "Product"}
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 900 }}>
                        {Number(s.qtyAvailable || 0)}
                      </Typography>
                    </TableCell>

                    <TableCell>{Number(s.lowThreshold || 0)}</TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: "flex-end" }}
                      >
                        <Button
                          variant="outlined"
                          sx={{ borderRadius: 3, fontWeight: 900, minWidth: 44 }}
                          onClick={() =>
                            setAdjust({
                              open: true,
                              productId: s.productId,
                              mode: "remove",
                            })
                          }
                        >
                          -
                        </Button>

                        <Button
                          variant="contained"
                          sx={{ borderRadius: 3, fontWeight: 900, minWidth: 44 }}
                          onClick={() =>
                            setAdjust({
                              open: true,
                              productId: s.productId,
                              mode: "add",
                            })
                          }
                        >
                          +
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <StockAdjustDialog
            open={adjust.open}
            productId={adjust.productId}
            mode={adjust.mode}
            onClose={() => setAdjust((prev) => ({ ...prev, open: false }))}
            onDone={() => refresh()}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default function StockPage() {
  
  return (
    <List resource="stock" actions={false} pagination={false} empty={false}>
      <StockBody />
    </List>
  );
}
