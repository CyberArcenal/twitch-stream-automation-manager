// src/main.tsx
import ReactDOM from "react-dom/client";
import "./styles/App.css";
import "./styles/scrollbar.css";
import "./styles/animations.css";
import "reflect-metadata";
import React from "react";
import ConditionalRouter from "./components/Shared/ConditionalRouter";
import App from "./routes/App";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext"; // new
import { DashboardLayoutProvider } from "./contexts/DashboardLayoutContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ThemeProvider>
        <DashboardLayoutProvider>
          <ConditionalRouter>
            <App />
          </ConditionalRouter>
        </DashboardLayoutProvider>
      </ThemeProvider>
    </SettingsProvider>
  </React.StrictMode>,
);
