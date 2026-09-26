"use client";

import { Bell, LayoutDashboard, MapPin, PlusCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactElement, SVGProps } from "react";

import { useNotifications } from "@/components/providers/NotificationProvider";

/** A single entry in the mobile bottom navigation bar. */
interface NavItem {
  /** Route the link points to, also used to derive the active state. */
  href: string;
  /** Visible label and accessible name base for the link. */
  label: string;
  /** Icon component rendered before the label. */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Fixed list of destinations shown in {@link BottomNav}. */
const STATIC_NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create Link", icon: PlusCircle },
  { href: "/tracking", label: "Track Order", icon: MapPin },
  { href: "/notifications", label: "Inbox", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/**
 * Fixed, mobile-only bottom navigation bar (`md:hidden`).
 *
 * Highlights the link matching the current route (exact match or a nested
 * path under it) and overlays an unread-count badge on the notifications
 * icon, sourced from {@link useNotifications}.
 */
export default function BottomNav(): ReactElement {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {STATIC_NAV.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        const isBell = href === "/notifications";
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
            aria-label={isBell && unreadCount > 0 ? `${label}, ${unreadCount} unread` : label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {isBell && unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
