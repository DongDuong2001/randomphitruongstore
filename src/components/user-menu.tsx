"use client";

import { LogOut, User, ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const t = useTranslations("common");
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-2">
        <Loader2 className="size-5 animate-spin text-white/70" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        aria-label={t("login")}
        className="p-2 text-white/70 hover:text-white"
        href="/login"
      >
        <User size={18} />
      </Link>
    );
  }

  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? t("account");
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <div className="relative">
      <button
        aria-label={t("accountMenu")}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-white/10 flex items-center justify-center">
          {avatarUrl ? (
            <span
              aria-hidden="true"
              className="size-full bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(avatarUrl)})` }}
            />
          ) : (
            <User className="size-5 text-white/70" />
          )}
        </div>
        <ChevronDown className={cn("size-4 text-white/70 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-in fade-in-0 zoom-in-95">
            <div className="border border-white/15 bg-[#11100e] rounded-xl shadow-lg overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <p className="font-bold text-sm truncate">{displayName}</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
              <Link
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                href="/account"
                onClick={() => setOpen(false)}
              >
                <User size={16} />
                {t("profile")}
              </Link>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut size={16} />
                {t("logout")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
