import React from "react";
import {Dialog,DialogTitle,DialogContent,Box,Typography,TextField,Button,Stack,} from "@mui/material";
import { PRODUCTS } from "../../productsCatalog";
import { requireCompany } from "../../companyStore";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");


type Props = {
  open: boolean;
  onClose: () => void;
  onDone: () => void};

type FormState = Record<string, { qty: number; thr: number }>;

export default function InitializeStockModal({ open, onClose, onDone }: Props) {
  const [form, setForm] = React.useState<FormState>({
    P1: { qty: 50, thr: 1 },
    P2: { qty: 50, thr: 5 },
    P3: { qty: 80, thr: 10 },
  });

  const setVal = (pid: string, key: "qty" | "thr", value: number) => {
    setForm((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], [key]: value },
    }));
  };

  const save = async () => {
    try {
      const c = requireCompany();
      await Promise.all(
        PRODUCTS.map(async (p) => {
          const v = form[p.productId];

          const res = await fetch(`${API_URL}/stock/${c.companyId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: p.productId,
              name: p.name,
              qtyAvailable: Number(v.qty),
              lowThreshold: Number(v.thr),})});

          if (!res.ok) {
            const txt = await res.text();
            throw new Error(`${p.productId} failed: ${res.status} - ${txt}`);}}));onDone();} 
    catch (err: any) {
      alert(err?.message || "Failed to initialize stock");}};

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>Initialize Stock</DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Typography sx={{ opacity: 0.7, mb: 2 }}>
          Enter the initial quantity and low threshold for each product.
        </Typography>

        <Stack spacing={2}>
          {PRODUCTS.map((p) => (
            <Box
              key={p.productId}
              sx={{
                border: "1px solid #e7e2d8",
                borderRadius: 5,
                p: 2,
                display: "grid",
                gridTemplateColumns: "70px 1fr 220px 220px",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography sx={{ fontWeight: 900 }}>{p.productId}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{p.name}</Typography>

              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Initial Qty
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={form[p.productId].qty}
                  onChange={(e) =>
                    setVal(p.productId, "qty", Number(e.target.value))
                  }
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Low Threshold
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={form[p.productId].thr}
                  onChange={(e) =>
                    setVal(p.productId, "thr", Number(e.target.value))
                  }
                />
              </Box>
            </Box>
          ))}
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderRadius: 3, fontWeight: 900 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={save}
            sx={{ borderRadius: 3, fontWeight: 900 }}
          >
            Save & Initialize
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
