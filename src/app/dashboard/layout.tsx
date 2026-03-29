"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNotifications, markNotificationsRead } from "@/lib/data";
import { useEffect, useState } from "react";
import { Notification } from "@/lib/types";
import { Bell, LogOut } from "lucide-react";

const DASH_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/explore", label: "Explore" },
  { href: "/dashboard/matches", label: "Matches" },
  { href: "/dashboard/swaps", label: "Sessions" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/groups", label: "Groups" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id).then(setNotifications);
    const interval = setInterval(() => getNotifications(user.id).then(setNotifications), 30000);
    // Check for session reminders on load (fire-and-forget)
    fetch("/api/sessions/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    }).catch(() => {});
    return () => clearInterval(interval);
  }, [user]);

  const unread = notifications.filter((n) => !n.read).length;
  const initials = user?.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleBellClick = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && user && unread > 0) {
      await markNotificationsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M17 8C17 10.76 14.76 13 12 13C9.24 13 7 10.76 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7 16C7 13.24 9.24 11 12 11C14.76 11 17 13.24 17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-lg font-bold text-navy-800">SkillSwap</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
              {DASH_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      active ? "bg-sky-100 text-navy-800" : "text-gray-500 hover:text-navy-800 hover:bg-gray-50"
                    }`}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <div className="relative">
                <button onClick={handleBellClick}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-navy-800">Notifications</div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-sm text-gray-400 text-center">No notifications</p>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <Link key={n.id} href={n.link || "/dashboard"}
                              onClick={() => setShowNotifs(false)}
                              className={`block px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? "bg-sky-50/50" : ""}`}>
                              <p className="text-xs font-semibold text-navy-800">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Avatar */}
              <Link href="/dashboard/profile" className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                )}
              </Link>

              {/* Logout */}
              <button onClick={handleSignOut}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Log out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden border-t border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            {DASH_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={`flex-shrink-0 px-4 py-3 text-center text-xs font-medium whitespace-nowrap transition-colors ${
                    active ? "text-navy-800 border-b-2 border-navy-800" : "text-gray-400 hover:text-gray-600"
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
