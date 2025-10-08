// src/components/Layout.tsx
"use client";

import React from "react";
import { Header } from "./Header";
import { PageWrapper } from "./PageWrapper";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <PageWrapper>
          {children}
        </PageWrapper>
      </main>
    </div>
  );
};
