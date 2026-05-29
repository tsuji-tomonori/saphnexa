import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminApp } from "./admin/AdminApp";
import { ChatApp } from "./chat/ChatApp";

const root = document.getElementById("root");
if (!root) throw new Error("Saphnexa root element is missing.");

mountSaphnexaWebApp(root, location.pathname);

export function mountSaphnexaWebApp(root: HTMLElement, pathname: string) {
  createRoot(root).render(
    <StrictMode>
      {pathname.startsWith("/admin") ? <AdminApp /> : <ChatApp />}
    </StrictMode>
  );
}
