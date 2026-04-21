"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextType = {
  forceCollapsed: boolean;
  setForceCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  forceCollapsed: false,
  setForceCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [forceCollapsed, setForceCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ forceCollapsed, setForceCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
