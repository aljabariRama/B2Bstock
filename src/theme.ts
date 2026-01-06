import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0c2340",
      dark: "#0b2545",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f6f2ea",
      paper: "#ffffff",
    },
    text: {
      primary: "#0c2340",
      secondary: "#6b7280",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: "0 18px 50px rgba(0,0,0,.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: "none",
          fontWeight: 800,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
  },
});
