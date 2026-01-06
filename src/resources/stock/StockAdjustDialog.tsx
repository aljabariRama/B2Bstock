import React from "react";
import { Dialog, DialogTitle, DialogContent, Box, Typography, TextField, Button } from "@mui/material";
import { requireCompany } from "../../companyStore";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");


type Props = {
  open: boolean;
  productId: string;
  mode: "add" | "remove";
  onClose: () => void;
  onDone: () => void;};

export default function StockAdjustDialog({ open, productId, mode, onClose, onDone }: Props) {
  const [amount, setAmount] = React.useState(1);

  React.useEffect(() => {
    if (open) setAmount(1);}, [open]);

  const submit = async () => {
    const c = requireCompany();
    const finalAmount = mode === "remove" ? -Math.abs(amount) : Math.abs(amount);

    const res = await fetch(`${API_URL}/stock/${c.companyId}/${productId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount }),
    });

    if (!res.ok) {
      const txt = await res.text();
      alert(`Stock update failed: ${txt}`);
      return;
    }

    onClose();
    onDone();
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        {mode === "add" ? "Add Stock" : "Remove Stock"} — {productId}
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Typography sx={{ opacity: 0.7, mb: 2 }}>
          Enter the amount to {mode === "add" ? "add" : "remove"}.
        </Typography>

        <TextField
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
          fullWidth
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 3, fontWeight: 900 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submit} sx={{ borderRadius: 3, fontWeight: 900 }}>
            Apply
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
