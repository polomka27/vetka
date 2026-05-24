import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "@/app/App";
import "@/styles/index.css";

// Блок монтирует корневое React-приложение в DOM-узел root.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
