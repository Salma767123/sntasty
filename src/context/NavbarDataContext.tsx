"use client";

import { createContext, useContext, use } from "react";

interface NavbarData {
  settings: any;
  categories: { _id: string; name: string; slug: string }[];
}

const NavbarDataContext = createContext<NavbarData>({
  settings: null,
  categories: [],
});

// Accepts a promise from the server layout and resolves it with React use()
// This allows the layout to stay synchronous (non-blocking) while data streams in
export function NavbarDataProvider({
  dataPromise,
  children,
}: {
  dataPromise: Promise<NavbarData>;
  children: React.ReactNode;
}) {
  // React use() suspends until the promise resolves — works with Suspense boundaries
  // After first load, the in-memory cache in layout.tsx resolves this instantly
  const { settings, categories } = use(dataPromise);

  return (
    <NavbarDataContext.Provider value={{ settings, categories }}>
      {children}
    </NavbarDataContext.Provider>
  );
}

export function useNavbarData() {
  return useContext(NavbarDataContext);
}
