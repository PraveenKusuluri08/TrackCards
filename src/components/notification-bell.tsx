"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  eventDate: string;
  readAt: string | null;
  createdAt: string;
  cardId: string | null;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function refresh() {
    const res = await fetch("/api/in-app-notifications", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { unreadCount: number; notifications: NotificationItem[] };
    setUnreadCount(data.unreadCount || 0);
    setItems(data.notifications || []);
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/in-app-notifications/${id}/read`, { method: "PATCH" });
    await refresh();
  }

  const top = useMemo(() => items.slice(0, 8), [items]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) refresh();
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        aria-label="Notifications"
      >
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <button
              type="button"
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="max-h-[360px] overflow-auto p-2">
            {top.length === 0 ? (
              <p className="px-2 py-6 text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="space-y-2">
                {top.map((n) => (
                  <li key={n.id} className={`rounded-lg border p-2 ${n.readAt ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50/50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-xs text-slate-600">{n.body}</p>}
                        <p className="mt-1 text-[11px] text-slate-500">
                          {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      {!n.readAt && (
                        <button
                          type="button"
                          className="shrink-0 text-xs font-medium text-teal-700 hover:text-teal-800"
                          onClick={() => markRead(n.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    {n.cardId && (
                      <div className="mt-2">
                        <Link href={`/cards/${n.cardId}/history`} className="text-xs font-medium text-teal-700 hover:text-teal-800">
                          View card →
                        </Link>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

