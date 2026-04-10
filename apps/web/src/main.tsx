import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { RouterProvider } from "@tanstack/react-router";
import BreakpointsProvider from "providers/BreakpointsProvider";
import NotistackProvider from "providers/NotistackProvider";
import QueryProvider from "providers/QueryProvider";
import SettingsProvider from "providers/SettingsProvider";
import ThemeProvider from "providers/ThemeProvider";
import React from "react";
import ReactDOM from "react-dom/client";
import router from "routes/router";
import "./locales/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <SettingsProvider>
        <ThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <NotistackProvider>
              <BreakpointsProvider>
                <RouterProvider router={router} />
              </BreakpointsProvider>
            </NotistackProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </SettingsProvider>
    </QueryProvider>
  </React.StrictMode>,
);
