// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // <- Pastikan ini ada

const app = <App />;
const content =
  process.env.NODE_ENV === "production" ? (
    <React.StrictMode>{app}</React.StrictMode>
  ) : (
    app
  );

createRoot(document.getElementById("root")!).render(content);
