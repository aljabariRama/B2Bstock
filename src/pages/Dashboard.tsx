import React from "react";
import { Box, Card, CardContent, Typography, Button, Stack, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { dataProvider } from "../dataProvider";
import { getCompany, resetCompany } from "../companyStore";
import { PRODUCTS } from "../productsCatalog";

function weekdayLabel(d: Date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

export default function Dashboard() {
  const nav = useNavigate();
  const company = getCompany();

  React.useEffect(() => {
    if (!company) nav("/company-setup");
  }, [company, nav]);

  const [total7, setTotal7] = React.useState(0);
  const [counts, setCounts] = React.useState<Record<string, number>>({
    Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0, Mon: 0,
  });

  React.useEffect(() => {
    (async () => {
      if (!company) return;
      const res = await dataProvider.getList("orders", {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: "createdAt", order: "DESC" },
        filter: {},
      });

      const items = res.data as any[];
      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - 7);

      const cts: Record<string, number> = { Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0, Mon:0 };
      let total = 0;

      for (const o of items) {
        const t = new Date(o.createdAt || o.updatedAt || "");
        if (isNaN(t.getTime())) continue;
        if (t >= from && t <= now) {
          total++;
          const lab = weekdayLabel(t);
          if (cts[lab] !== undefined) cts[lab] += 1;
        }
      }

      setTotal7(total);
      setCounts(cts);
    })();
  }, [company]);

  if (!company) return null;

  const maxDay = Math.max(...Object.values(counts), 1);

  const goStock = () => nav("/stock");
  const goOrders = () => nav("/orders");

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={goStock} sx={{ borderRadius: 3, fontWeight: 800 }}>
          Stock
        </Button>
        <Button variant="outlined" onClick={goOrders} sx={{ borderRadius: 3, fontWeight: 800 }}>
          Orders
        </Button>
        <Button
          variant="outlined"
          color="warning"
          onClick={resetCompany}
          sx={{ borderRadius: 3, fontWeight: 800, marginLeft: "auto" }}
        >
          Reset Company
        </Button>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
        Dashboard
      </Typography>

      {/* Company card */}
      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              background: "#f2efe6",
              border: "1px solid #e5e0d6",
            }}
          >
            🏢
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {company.companyName}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 0.8, flexWrap: "wrap" }}>
              <Chip size="small" label={company.email} />
              <Chip size="small" label={company.region} />
            </Stack>

            <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mt: 1 }}>
              CompanyId: {company.companyId}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={goStock} sx={{ borderRadius: 3, fontWeight: 900 }}>
              Go to Stock
            </Button>
            <Button variant="contained" onClick={goOrders} sx={{ borderRadius: 3, fontWeight: 900 }}>
              Go to Orders
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Grid */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" },
          alignItems: "start",
        }}
      >
        {/* Products Catalog */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6">Products Catalog</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Select items to manage stock and create orders
            </Typography>

            <Stack spacing={1.5}>
              {PRODUCTS.map((p) => (
                <Card
                  key={p.productId}
                  variant="outlined"
                  sx={{ borderRadius: 4, cursor: "pointer" }}
                  onClick={goStock}
                >
                  <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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
                        {p.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>{p.name}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.6 }}>
                          <Chip size="small" label={`ID: ${p.productId}`} />
                          <Chip size="small" label={p.tag} />
                        </Stack>
                      </Box>
                    </Stack>

                    <Typography sx={{ opacity: 0.5, fontSize: 20 }}>›</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Region */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6">Region</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Current company location
            </Typography>

            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{company.region}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Widget
                </Typography>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Orders Overview */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6">Orders Overview</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Last 7 days • total: {total7}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
              {["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"].map((d) => {
                const h = Math.max(10, Math.round((counts[d] / maxDay) * 70));
                const isLast = d === "Mon";
                return (
                  <Box key={d} sx={{ textAlign: "center", width: 28 }}>
                    <Box
                      sx={{
                        height: 70,
                        borderRadius: 2,
                        border: "1px solid #e7e2d8",
                        background: "#fff",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: h,
                          background: isLast ? "#d2a52b" : "#eef0f4",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {d}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>

            <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mt: 2 }}>
              Max/day: {maxDay}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
