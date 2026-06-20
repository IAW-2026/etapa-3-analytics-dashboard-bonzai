"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, useUser, useClerk } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import styles from "./page.module.css";

export default function LoginPage() {
  const { isAdmin, isLoaded, userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (userId && isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, isAdmin, router]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        {userId && !isAdmin ? (
          <div className={styles.deniedCard}>
            <div className={styles.deniedIcon}>
              <ShieldAlert size={24} />
            </div>
            <h1 className={styles.deniedTitle}>Access Denied</h1>
            <p className={styles.deniedText}>
              Your account does not have the <strong>super_admin</strong> role required to access the
              Analytics Dashboard.
            </p>
            <button
              onClick={() => signOut({ redirectUrl: "/login" })}
              className={styles.signOutBtn}
            >
              Sign in with another account
            </button>
          </div>
        ) : (
          <div className={styles.signInWrapper}>
            <div className={styles.logo}>AD</div>
            <SignIn
              routing="hash"
              forceRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "border border-[var(--color-border)] shadow-none",
                  headerTitle: "font-serif text-[var(--color-primary)]",
                  headerSubtitle: "text-[var(--color-text-muted)]",
                  formButtonPrimary: "bg-[var(--color-primary)] hover:bg-black text-sm uppercase tracking-[0.1em]",
                  formFieldLabel: "text-xs font-semibold",
                  formFieldInput: "border-[1.5px] border-[var(--color-border)] rounded-xl",
                  footerActionLink: "text-[var(--color-primary)]",
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
