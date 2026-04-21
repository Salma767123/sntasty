"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Package,
  LayoutGrid,
  Loader2,
  Scale,
  ClipboardList,
  Ticket,
  FileText,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Star,
  Truck,
  Menu,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
}

function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { forceCollapsed } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const sidebarCollapsed = isCollapsed || forceCollapsed;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isPending && pathname !== "/admin/login") {
      if (!session || (session.user as any)?.role !== "admin") {
        router.replace("/admin/login");
      }
    }
  }, [session, isPending, pathname, router]);

  if (isPending) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#234d1b]">
        <Loader2 className="animate-spin text-[#f8bf51] mb-4" size={48} />
        <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px]">
          Verifying credentials...
        </p>
      </div>
    );
  }

  // Don't show layout on the login page itself
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isPending && (!session || (session.user as any)?.role !== "admin")) {
    return null;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/products", label: "Product Master", icon: Package },
    // { href: "/admin/inventory", label: "Inventory", icon: ClipboardList },
    { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
    { href: "/admin/uom", label: "UOM Master", icon: Scale },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/coupons", label: "Promo Codes", icon: Ticket },
    { href: "/admin/customers", label: "Customer Base", icon: Users },
    { href: "/admin/enquiries", label: "Event Enquiries", icon: ClipboardList },
    { href: "/admin/legal", label: "Legal Pages", icon: FileText },
    { href: "/admin/cms", label: "CMS", icon: FileText },
  ];

  const bottomNavItems = [
    { href: "/admin/hero-slides", label: "Hero Carousel", icon: ImageIcon },
    { href: "/admin/shipping", label: "Shipping Rates", icon: Truck },
    { href: "/admin/settings", label: "Global Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#ece0cc] font-sans overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#234d1b",
            color: "#fff",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: "600",
            padding: "16px",
          },
          success: {
            iconTheme: {
              primary: "#f8bf51",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#234d1b] text-white z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-0.5 overflow-hidden">
            {settings?.logo ? (
              <Image
                src={settings.logo}
                className="w-full h-full object-contain"
                alt="Logo"
                width={32}
                height={32}
              />
            ) : (
              <span className="text-[#234d1b] font-black italic text-[10px]">
                SN
              </span>
            )}
          </div>
          <h1 className="text-sm font-serif font-black tracking-tight uppercase text-[#ece0cc] truncate max-w-[180px]">
            {settings?.shopName || "Sai Nandhini"}
          </h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 touch-manipulation focus-visible:ring-2 focus-visible:ring-[#ece0cc] focus-visible:outline-none rounded-xl"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 touch-manipulation"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isMobileOpen ? 0 : "-100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="md:hidden fixed inset-y-0 left-0 w-[280px] bg-[#234d1b] text-white flex flex-col shadow-2xl z-50 overflow-y-auto custom-scrollbar"
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <span className="text-xs text-[#f8bf51] uppercase font-black tracking-[0.2em]">
            Menu
          </span>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 touch-manipulation focus-visible:ring-2 focus-visible:ring-[#f8bf51] focus-visible:outline-none rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-grow space-y-1.5 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-colors focus-visible:ring-2 focus-visible:ring-[#f8bf51] focus-visible:outline-none touch-manipulation ${
                  isActive
                    ? "bg-[#ece0cc] text-[#234d1b] shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="shrink-0"
                />
                <span
                  className={`text-[11px] font-black uppercase tracking-wider ${isActive ? "" : "opacity-80"}`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f8bf51]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2 mt-auto shrink-0">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-colors focus-visible:ring-2 focus-visible:ring-[#f8bf51] focus-visible:outline-none touch-manipulation ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "hover:bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
            }}
            className="flex items-center gap-4 p-3.5 w-full text-left hover:bg-red-500/20 rounded-2xl transition-colors text-red-300/60 hover:text-red-200 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none touch-manipulation"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              End Session
            </span>
          </button>
        </div>
      </motion.aside>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 300 }}
        className="hidden md:flex bg-[#234d1b] text-white flex-col shadow-2xl z-20 relative transition-all duration-300 ease-in-out"
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 bg-[#f8bf51] text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform z-30 ring-2 ring-[#ece0cc] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none touch-manipulation"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={14} strokeWidth={3} />
          ) : (
            <ChevronLeft size={14} strokeWidth={3} />
          )}
        </button>

        <div
          className={`flex items-center gap-3 mb-8 p-5 ${sidebarCollapsed ? "justify-center p-3" : ""}`}
        >
          <div className={`${sidebarCollapsed ? "w-12 h-12" : "w-11 h-11"} bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg shrink-0 relative`}>
            {settings?.logo ? (
              <Image
                src={settings.logo}
                className="w-full h-full object-contain p-1"
                alt="Logo"
                width={44}
                height={44}
              />
            ) : (
              <span className="text-[#234d1b] font-black italic text-xs">SN</span>
            )}
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-w-0 flex-1"
            >
              <h1 className="text-sm font-serif font-black tracking-tight leading-tight uppercase text-[#ece0cc] truncate">
                {settings?.shopName || "Sai Nandhini"}
              </h1>
              <p className="text-[9px] text-[#f8bf51] uppercase font-black tracking-[0.2em] mt-0.5">
                Admin Portal
              </p>
            </motion.div>
          )}
        </div>

        <nav className="flex-grow space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-colors group relative focus-visible:ring-2 focus-visible:ring-[#f8bf51] focus-visible:outline-none touch-manipulation ${
                  isActive
                    ? "bg-[#ece0cc] text-[#234d1b] shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`shrink-0 transition-transform ${isActive ? "text-[#234d1b]" : "group-hover:scale-110"}`}
                />
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${isActive ? "" : "opacity-80"}`}
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f8bf51]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2 mt-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-colors focus-visible:ring-2 focus-visible:ring-[#f8bf51] focus-visible:outline-none touch-manipulation ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "hover:bg-white/5 text-white/60 hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={item.label}
              >
                <item.icon
                  size={20}
                  className={
                    item.href === "/admin/settings" && isActive
                      ? "animate-spin-slow"
                      : ""
                  }
                />
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
            }}
            className={`flex items-center gap-4 p-3.5 w-full text-left hover:bg-red-500/20 rounded-2xl transition-colors text-red-300/60 hover:text-red-200 group focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none touch-manipulation ${sidebarCollapsed ? "justify-center" : ""}`}
            title="End Session"
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {!sidebarCollapsed && (
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                End Session
              </span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-hidden bg-[#ece0cc] relative h-full pt-16 md:pt-0">
        <div className="h-full overflow-y-auto w-full max-w-[100vw]">
          {/* Decorative header blur */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#234d1b]/5 to-transparent pointer-events-none z-0 hidden md:block" />

          <div className="px-4 py-6 md:p-8 lg:p-12 relative z-10 w-full lg:max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
