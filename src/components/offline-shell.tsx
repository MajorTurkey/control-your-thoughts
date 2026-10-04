import { useEffect } from "react";

export function OfflineShell() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.top !== window.self) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* the desk still opens without a stored copy */
    });
  }, []);
  return null;
}
