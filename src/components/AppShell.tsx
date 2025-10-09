"use client";

import { ReactNode, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import NotificationsSheet from "@/components/NotificationsSheet";

export default function AppShell({ children }: { children: ReactNode }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="relative min-h-dvh">
      <Header
        onNotificationsClick={() => setNotifOpen(true)}
        // hasUnread={...} // сюда можешь подставить флаг непрочитанных, если есть
      />
      <div className="pt-14 md:pt-16">
        {children}
      </div>

      <BottomNav />

      <NotificationsSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
