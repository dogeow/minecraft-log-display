export const appConfig =
  typeof document === "undefined"
    ? {}
    : JSON.parse(document.getElementById("app-config")?.textContent || "{}");
