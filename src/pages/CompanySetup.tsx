import React from "react";
import { Card, CardContent, Typography, TextField, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { saveCompany } from "../companyStore";

export default function CompanySetupPage() {
  const nav = useNavigate();

  const [companyName, setCompanyName] = React.useState(localStorage.getItem("companyName") || "");
  const [email, setEmail] = React.useState(localStorage.getItem("email") || "");
  const [region, setRegion] = React.useState(localStorage.getItem("region") || "Jordan");

  const onContinue = () => {
    saveCompany({ companyName, email, region });
    nav("/"); // dashboard
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <Card sx={{ width: "min(760px, 96vw)", borderRadius: 4 }}>
        <CardContent sx={{ p: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Company Setup
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>
            Enter your company information (saved in the browser).
          </Typography>

          <Stack spacing={2.5}>
            <div>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Company Name</Typography>
              <TextField fullWidth value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Email</Typography>
              <TextField fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Region</Typography>
              <TextField fullWidth value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>

            <Button
              variant="contained"
              size="large"
              onClick={onContinue}
              sx={{ borderRadius: 3, py: 1.4 }}
            >
              Continue
            </Button>

            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Tip: You can reset the company later from the dashboard
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
}
