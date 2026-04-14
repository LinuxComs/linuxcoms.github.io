import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Admin from "./Admin.jsx";

// This finds the <div id="admin-root"> in your admin.html and injects the React code into it
createRoot(document.getElementById("admin-root")).render(
  <StrictMode>
    <Admin />
  </StrictMode>,
);
