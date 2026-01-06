import { Layout, AppBar } from "react-admin";
import { Box } from "@mui/material";

function MyAppBar(props: any) {
  return (
    <AppBar
      {...props}
      sx={{
        "& .RaAppBar-toolbar": { backgroundColor: "#0c2340" },
      }}
    />
  );
}

export default function MyLayout(props: any) {
  return (
    <Box sx={{ backgroundColor: "#f6f2ea", minHeight: "100vh" }}>
      <Layout {...props} appBar={MyAppBar} />
    </Box>
  );
}
