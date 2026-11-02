import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LabApp } from "@/components/lab/lab-app";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("找不到根节点");

createRoot(root).render(
  <StrictMode>
    <LabApp />
  </StrictMode>,
);
