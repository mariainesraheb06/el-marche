"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ productId }: { productId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, eventType: "view" }),
      keepalive: true,
    }).catch(() => {});
  }, [productId]);

  return null;
}