export const routes = [
  { path: "/", rewrite: "/chat/index.html", role: "authenticated" },
  { path: "/chat", app: "chat", role: "general_user" },
  { path: "/admin", app: "admin", role: "admin" },
  { path: "/admin/docs/latest/", app: "admin-artifact", role: "admin" },
  { path: "/admin/test-reports/allure/latest/", app: "admin-artifact", role: "admin" },
  { path: "/event/realtime", app: "realtime", role: "ticket" }
];
