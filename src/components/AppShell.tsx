"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import NotificationsSheet from "@/components/NotificationsSheet";
import { useAuth } from "@/providers/AuthProvider";
import { AppDataProvider } from "@/providers/AppDataProvider";

const loader = (
  <div className="flex min-h-dvh items-center justify-center bg-[#F7FAFF]">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/40 border-t-primary" />
  </div>
);

export default function AppShell({ children }: { children: ReactNode }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuth();

  const isAuthScreen = useMemo(() => {
    if (!pathname) {
      return false;
    }

    return pathname === "/auth" || pathname.startsWith("/auth/");
  }, [pathname]);

  const headerName = useMemo(() => {
    const fullName = user?.fullName?.trim();
    if (!fullName) {
      return null;
    }
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return null;
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return `${parts[0]} ${parts[1]}`;
  }, [user?.fullName]);

  useEffect(() => {
    if (status === "unauthenticated" && !isAuthScreen) {
      router.replace("/auth");
    }
  }, [isAuthScreen, router, status]);

  useEffect(() => {
    if (status === "authenticated" && isAuthScreen) {
      router.replace("/home");
    }
  }, [isAuthScreen, router, status]);

  if (status === "loading") {
    return loader;
  }

  if (isAuthScreen) {
    return <div className="min-h-dvh bg-[#F7FAFF]">{children}</div>;
  }

  return (
    <AppDataProvider>
      <div className="relative min-h-dvh">
        <Header
          onNotificationsClick={() => setNotifOpen(true)}
          notificationsOpen={notifOpen}
          userName={headerName ?? undefined}
          // hasUnread={...} // placeholder for unread logic
        />
        <div className="pt-14 md:pt-16">{children}</div>

        <BottomNav />

        <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
    </AppDataProvider>
  );
}
