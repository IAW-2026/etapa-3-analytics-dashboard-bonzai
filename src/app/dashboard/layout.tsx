"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Users,
  Truck,
  LogOut,
  Menu,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import styles from "./layout.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
  { label: "Seller App", href: "/dashboard/seller", icon: <Store size={16} /> },
  { label: "Payments App", href: "/dashboard/payments", icon: <CreditCard size={16} /> },
  { label: "Buyer App", href: "/dashboard/buyer", icon: <Users size={16} /> },
  { label: "Shipping App", href: "/dashboard/shipping", icon: <Truck size={16} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/login");
    }
  }, [isLoaded, isAdmin, router]);

  if (!isLoaded || !isAdmin) return null;

  const sidebarContent = (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>AD</div>
        <span className={styles.logoText}>Analytics</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const linkClasses = [
            styles.navLink,
            isActive ? styles.navLinkActive : styles.navLinkInactive,
          ].filter(Boolean).join(" ");
          return (
            <a key={item.href} href={item.href} className={linkClasses}
              onClick={() => setSidebarOpen(false)}>
              {item.icon}
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.firstName?.charAt(0) || "A"}
          </div>
          <div>
            <div className={styles.userName}>{user?.fullName || "Admin"}</div>
            <div className={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress || "Analytics"}</div>
          </div>
        </div>
        <button onClick={() => signOut({ redirectUrl: "/login" })}
          className={styles.logoutButton}>
          <LogOut size={12} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.desktopSidebar}>
        <div className={styles.desktopFixed}>{sidebarContent}</div>
      </div>
      {sidebarOpen && (
        <>
          <div className={styles.mobileOverlay} onClick={() => setSidebarOpen(false)} />
          <div className={styles.mobileSidebar}>{sidebarContent}</div>
        </>
      )}
      <main className={styles.main}>
        <button className={styles.mobileMenuButton} onClick={() => setSidebarOpen(true)}>
          <Menu size={20} />
        </button>
        {children}
      </main>
    </div>
  );
}
