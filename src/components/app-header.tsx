"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { SignOutButton } from "@/components/sign-out-button";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeline", label: "Timeline" },
  { href: "/score", label: "Score" },
  { href: "/settings", label: "Settings" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({
  showNotifications = true,
  showSignOut = true,
}: {
  showNotifications?: boolean;
  showSignOut?: boolean;
}) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const items = useMemo(() => NAV, []);
  const active = useMemo(() => items.find((i) => isActivePath(pathname, i.href))?.href ?? null, [items, pathname]);

  return (
    <header className="sticky top-0 z-10 border-b border-amber-200/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-teal-600 hover:text-teal-700">
          PayTrack AI
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {items.map((item) => {
            const isActive = active === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActive ? "text-slate-900" : "text-slate-600"}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
          {showNotifications && <NotificationBell />}
          {showSignOut && <SignOutButton />}
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 sm:hidden">
          {showNotifications && <NotificationBell />}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-3 top-3 z-50 w-[min(92vw,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">Menu</p>
              <button
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="p-2">
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = active === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                        isActive ? "bg-amber-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              {showSignOut && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <SignOutButton />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

