import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Polyfill process for libraries that expect it
if (typeof window !== 'undefined') {
  if (!(window as any).process) {
    // @ts-ignore
    (window as any).process = { env: { NODE_ENV: import.meta.env.MODE } };
  }
  if (!(window as any).global) {
    // @ts-ignore
    (window as any).global = window;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
