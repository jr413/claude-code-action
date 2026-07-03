"use client";

import { useState } from "react";
import { savePushSubscription } from "./push-actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "enabled" | "error"
  >("idle");

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) return null;

  async function handleEnable() {
    setStatus("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey!,
        ) as BufferSource,
      });

      const json = subscription.toJSON();
      const { error } = await savePushSubscription({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });

      setStatus(error ? "error" : "enabled");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-medium">プッシュ通知</p>
      {status === "enabled" ? (
        <p className="mt-1 text-sm text-emerald-600">通知をオンにしました</p>
      ) : (
        <button
          onClick={handleEnable}
          disabled={status === "loading"}
          className="mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {status === "loading" ? "設定中..." : "通知をオンにする"}
        </button>
      )}
      {status === "error" && (
        <p className="mt-1 text-sm text-red-600">設定に失敗しました</p>
      )}
    </div>
  );
}
