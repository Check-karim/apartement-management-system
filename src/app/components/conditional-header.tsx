"use client";

import { usePathname } from "next/navigation";
import { MobileHeader } from "./mobile-header";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on login page
  const hideHeader = pathname === "/login" || pathname.startsWith("/login");
  
  if (hideHeader) {
    return null;
  }
  
  return <MobileHeader />;
} 