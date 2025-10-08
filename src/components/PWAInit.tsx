"use client";
import { useEffect } from "react";
import { initPWAInstallListener } from "@/utils/pwaInstall";

export default function PWAInit() {
  useEffect(() => {
    initPWAInstallListener();
  }, []);
  return null;
}
