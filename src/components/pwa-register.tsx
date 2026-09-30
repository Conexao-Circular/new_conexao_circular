"use client";

import { useEffect } from "react";

/**
 * Registers the service worker silently so the app works offline and feels
 * app-like when opened from a link — with NO install prompt or notification
 * banner. Renders nothing.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);

  return null;
}
