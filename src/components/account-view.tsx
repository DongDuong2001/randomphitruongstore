"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/format";
import type { ApiResponse } from "@/lib/api-response";
import {
  Package,
  MessageSquare,
  User,
  ChevronDown,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Save,
  X,
  Loader2,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string;
  color: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | null;
  subtotal: number;
  createdAt: string;
  items: OrderItem[];
  statusHistory: { status: string; createdAt: string }[];
}

interface InquiryImage {
  id: string;
  imageUrl: string;
}

interface ProductInquiry {
  id: string;
  fullName: string;
  phone: string;
  status: string;
  customerMessage: string | null;
  preferredSize: string | null;
  preferredColor: string | null;
  quotedPrice: number | null;
  createdAt: string;
  product: { nameVi: string; nameEn: string; slug: string } | null;
  images: InquiryImage[];
}

interface Profile {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string;
  province: string;
  district: string;
  ward: string;
  zaloPhone: string | null;
  instagramHandle: string | null;
  preferredLanguage: string;
}

type Tab = "orders" | "consultations" | "profile";

/* ── Main component ────────────────────────────────────────────────────────── */

export function AccountView({ title }: { title: string }) {
  const t = useTranslations("account");
  const locale = useLocale() as "vi" | "en";
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  if (authLoading) {
    return (
      <div className="container-shell py-10 sm:py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="size-8 animate-spin border-4 border-[#a72b1f] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-shell py-10 sm:py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto size-12 text-zinc-400">!</div>
          <h1 className="mt-4 text-2xl font-black">{t("signInRequired")}</h1>
          <p className="mt-2 text-zinc-600">{t("signInRequiredBody")}</p>
          <Link className="button-primary mt-6 inline-block" href="/login">
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? t("customer");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: t("myOrders"), icon: <Package size={18} /> },
    { key: "consultations", label: t("myConsultations"), icon: <MessageSquare size={18} /> },
    { key: "profile", label: t("profile"), icon: <User size={18} /> },
  ];

  return (
    <div className="container-shell py-10 sm:py-16">
      <header className="mb-10">
        <p className="eyebrow text-[#a72b1f]">{t("welcomeBack", { name: displayName })}</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1>
      </header>

      {/* Tab navigation */}
      <nav className="flex gap-1 border-b border-black/10 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#a72b1f] text-[#a72b1f]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "orders" && <OrdersSection locale={locale} />}
      {activeTab === "consultations" && <ConsultationsSection locale={locale} />}
      {activeTab === "profile" && <ProfileSection />}
    </div>
  );
}

/* ── Orders Section ────────────────────────────────────────────────────────── */

function OrdersSection({ locale }: { locale: "vi" | "en" }) {
  const t = useTranslations("account");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/orders")
      .then(async (res) => {
        const json: ApiResponse<Order[]> = await res.json();
        if (json.success) setOrders(json.data);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-black/10 bg-white rounded-xl overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
          {t("orderHistory")}
        </div>
        <div className="divide-y divide-black/5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-zinc-200 rounded" />
                <div className="h-4 bg-zinc-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-black/10 bg-white rounded-xl p-6 text-center text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="border border-black/10 bg-white rounded-xl overflow-hidden">
      <div className="border-b border-black/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
        {t("orderHistory")}
      </div>
      {orders.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 text-sm">{t("noOrders")}</div>
      ) : (
        <div className="divide-y divide-black/5">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              locale={locale}
              expanded={expandedOrder === order.id}
              onToggle={() =>
                setExpandedOrder(expandedOrder === order.id ? null : order.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  locale,
  expanded,
  onToggle,
}: {
  order: Order;
  locale: "vi" | "en";
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("account");
  const date = new Date(order.createdAt).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-zinc-900">
              {t("orderNumber")}{order.orderNumber}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {date}
            </span>
            <span>
              {t("total")}: {formatPrice(order.totalAmount ?? order.subtotal, locale)}
            </span>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-black/5 px-4 pb-4">
          <div className="divide-y divide-black/5">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {t("size")}: {item.size} · {t("color")}: {item.color} · {t("quantity")}: {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                  {formatPrice(item.unitPrice * item.quantity, locale)}
                </span>
              </div>
            ))}
          </div>
          {order.statusHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                {t("latestUpdate")}
              </p>
              <p className="text-xs text-zinc-600">
                {order.statusHistory[0].status.replaceAll("_", " ")} —{" "}
                {new Date(order.statusHistory[0].createdAt).toLocaleDateString(
                  locale === "vi" ? "vi-VN" : "en-US",
                  { day: "2-digit", month: "2-digit", year: "numeric" }
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Consultations Section ─────────────────────────────────────────────────── */

function ConsultationsSection({ locale }: { locale: "vi" | "en" }) {
  const t = useTranslations("account");
  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/consultations")
      .then(async (res) => {
        const json: ApiResponse<{ inquiries: ProductInquiry[] }> = await res.json();
        if (json.success) setInquiries(json.data.inquiries);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load consultations"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-black/10 bg-white rounded-xl overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
          {t("consultationHistory")}
        </div>
        <div className="divide-y divide-black/5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="h-4 bg-zinc-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-black/10 bg-white rounded-xl p-6 text-center text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="border border-black/10 bg-white rounded-xl overflow-hidden">
      <div className="border-b border-black/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
        {t("consultationHistory")}
      </div>
      {inquiries.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 text-sm">{t("noConsultations")}</div>
      ) : (
        <div className="divide-y divide-black/5">
          {inquiries.map((inquiry) => (
            <InquiryRow key={inquiry.id} inquiry={inquiry} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function InquiryRow({
  inquiry,
  locale,
}: {
  inquiry: ProductInquiry;
  locale: "vi" | "en";
}) {
  const t = useTranslations("account");
  const date = new Date(inquiry.createdAt).toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );
  const productName = locale === "vi" ? inquiry.product?.nameVi : inquiry.product?.nameEn;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-zinc-900">
              {productName ?? t("inspiration")}
            </span>
            <StatusBadge status={inquiry.status} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {date}
            </span>
          </div>
          {inquiry.customerMessage && (
            <p className="mt-2 text-sm text-zinc-600 line-clamp-2">
              {inquiry.customerMessage}
            </p>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
            {inquiry.preferredSize && (
              <span>{t("desiredSize")}: {inquiry.preferredSize}</span>
            )}
            {inquiry.preferredColor && (
              <span>{t("desiredColor")}: {inquiry.preferredColor}</span>
            )}
          </div>
          {inquiry.quotedPrice != null && (
            <p className="mt-1 text-sm font-medium text-[#a72b1f]">
              {t("quotedPrice")}: {formatPrice(inquiry.quotedPrice, locale)}
            </p>
          )}
        </div>
      </div>
      {inquiry.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {inquiry.images.map((img) => (
            <div
              key={img.id}
              className="relative size-16 flex-shrink-0 rounded-md overflow-hidden bg-zinc-100 border border-black/5"
            >
              <Image
                src={img.imageUrl}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Profile Section ───────────────────────────────────────────────────────── */

function ProfileSection() {
  const t = useTranslations("account");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/customer/profile")
      .then(async (res) => {
        const json: ApiResponse<Profile> = await res.json();
        if (!cancelled) {
          if (json.success) {
            setProfile(json.data);
            setForm(json.data);
          } else {
            setError(json.error);
          }
        }
      })
      .catch(() => { if (!cancelled) setError("Failed to load profile"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json: ApiResponse<Profile> = await res.json();
      if (json.success) {
        setProfile(json.data);
        setForm(json.data);
        setEditing(false);
      } else {
        setError(json.error);
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="border border-black/10 bg-white rounded-xl overflow-hidden">
        <div className="border-b border-black/10 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
          {t("myProfile")}
        </div>
        <div className="p-4 space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-zinc-200 rounded w-1/2" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="border border-black/10 bg-white rounded-xl p-6 text-center text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="border border-black/10 bg-white rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <span className="text-sm font-bold uppercase tracking-[0.1em] text-zinc-600">
          {t("myProfile")}
        </span>
        {!editing ? (
          <button
            onClick={() => {
              setEditing(true);
              setForm(profile ?? {});
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[#a72b1f] hover:underline"
          >
            <Edit3 size={14} />
            {t("editProfile")}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setForm(profile ?? {});
              }}
              className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800"
            >
              <X size={14} />
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-xs font-bold text-white bg-[#a72b1f] px-3 py-1.5 rounded-md hover:bg-[#8b2218] disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t("save")}
            </button>
          </div>
        )}
      </div>

      {error && profile ? (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {profile && (
        <div className="p-4">
          {editing ? (
            <div className="space-y-4">
              <ProfileField label={t("fullName")} value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
              <ProfileField label={t("phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} icon={<Phone size={16} />} />
              {profile.email && <ProfileReadOnlyField label={t("email")} value={profile.email} icon={<Mail size={16} />} />}
              <ProfileField label={t("address")} value={form.address} onChange={(v) => setForm({ ...form, address: v })} icon={<MapPin size={16} />} />
              <div className="grid grid-cols-3 gap-3">
                <ProfileField label={t("province")} value={form.province} onChange={(v) => setForm({ ...form, province: v })} />
                <ProfileField label={t("district")} value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
                <ProfileField label={t("ward")} value={form.ward} onChange={(v) => setForm({ ...form, ward: v })} />
              </div>
              <ProfileField label="Zalo" value={form.zaloPhone} onChange={(v) => setForm({ ...form, zaloPhone: v })} />
              <ProfileField label="Instagram" value={form.instagramHandle} onChange={(v) => setForm({ ...form, instagramHandle: v })} />
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <ProfileRow label={t("fullName")} value={profile.fullName} />
              <ProfileRow label={t("phone")} value={profile.phone} icon={<Phone size={14} />} />
              {profile.email && <ProfileRow label={t("email")} value={profile.email} icon={<Mail size={14} />} />}
              <ProfileRow
                label={t("address")}
                value={formatAddress(profile)}
                icon={<MapPin size={14} />}
              />
              {profile.zaloPhone && <ProfileRow label="Zalo" value={profile.zaloPhone} />}
              {profile.instagramHandle && <ProfileRow label="Instagram" value={profile.instagramHandle} />}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-28 flex-shrink-0 text-zinc-500 flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className="text-zinc-900 font-medium">{value}</dd>
    </div>
  );
}

function ProfileReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 flex items-center gap-1.5 text-xs font-bold text-zinc-500">
        {icon}
        {label}
      </span>
      <div className="w-full rounded-md border border-black/10 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        {value}
      </div>
    </div>
  );
}

function formatAddress(profile: Profile) {
  const address = [
    profile.address,
    profile.ward,
    profile.district,
    profile.province
  ].filter(Boolean);

  return address.length > 0 ? address.join(", ") : "-";
}

function ProfileField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-500 mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-black/15 rounded-md px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#a72b1f]/30 focus:border-[#a72b1f]"
      />
    </div>
  );
}
