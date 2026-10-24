import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { useStudy } from "./storage";
void useStudy.getState().initialize();
function Workspace() {
  const ready = useStudy((s) => s.ready);
  return ready ? (
    <App />
  ) : (
    <main role="status">Loading your saved workspace…</main>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Workspace />
    </BrowserRouter>
  </React.StrictMode>,
);
