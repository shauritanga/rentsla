import React, { useState, useEffect, useRef, useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";

/* ------------------------------------------------------------------ */
/*  Notification types                                                 */
/* ------------------------------------------------------------------ */
interface AppNotification {
    id: string;
    type: string;
    data: {
        type?: string;
        lease_id?: number;
        stage?: string;
        message: string;
    };
    read_at: string | null;
    created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
function DashboardIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.293 2.293a1 1 0 011.414 0l6 6A1 1 0 0116 10h-2v6a1 1 0 01-1 1h-2v-4H9v4H7a1 1 0 01-1-1v-6H4a1 1 0 01-.707-1.707l6-6z" />
        </svg>
    );
}
function FloorsIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V9zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
        </svg>
    );
}
function UnitsIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
        </svg>
    );
}
function TenantsIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
        </svg>
    );
}
function LeasesIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                clipRule="evenodd"
            />
        </svg>
    );
}
function PaymentsIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm12-1a1 1 0 11-2 0 1 1 0 012 0zM2 15.25h16a.75.75 0 010 1.5H2a.75.75 0 010-1.5z"
                clipRule="evenodd"
            />
        </svg>
    );
}
function InvoicesIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zM13.25 9a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5H11a.75.75 0 010-1.5h1.5v-1.5a.75.75 0 01.75-.75zM6 12.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM6.75 15a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z"
                clipRule="evenodd"
            />
        </svg>
    );
}
function StaffIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
        </svg>
    );
}
function RolesIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M8.157 2.176a1.5 1.5 0 00-1.147 0l-4.084 1.69A1.5 1.5 0 002 5.25v2.303c0 2.092.518 4.15 1.457 5.876A12.22 12.22 0 007.96 18.3a1.5 1.5 0 001.578.08 12.19 12.19 0 004.492-4.793A14.862 14.862 0 0015.5 7.554V5.25a1.5 1.5 0 00-.926-1.385l-4.084-1.69zM10 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                clipRule="evenodd"
            />
        </svg>
    );
}
function ChevronDownIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
            />
        </svg>
    );
}
function ChevronRightIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
            />
        </svg>
    );
}
function AccountingIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
    );
}
function BellIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M10 2a6 6 0 00-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 00.515 1.076 32.91 32.91 0 003.256.508 3.5 3.5 0 006.972 0 32.903 32.903 0 003.256-.508.75.75 0 00.515-1.076A11.448 11.448 0 0116 8a6 6 0 00-6-6z"
                clipRule="evenodd"
            />
        </svg>
    );
}
function MenuIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zm0 5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Nav items                                                          */
/* ------------------------------------------------------------------ */
const navItems = [
    {
        label: "Dashboard",
        icon: DashboardIcon,
        id: "dashboard",
        href: "/manager/dashboard",
    },
    {
        label: "Floors",
        icon: FloorsIcon,
        id: "floors",
        href: "/manager/floors",
    },
    { label: "Units", icon: UnitsIcon, id: "units", href: "/manager/units" },
    {
        label: "Tenants",
        icon: TenantsIcon,
        id: "tenants",
        href: "/manager/tenants",
    },
    {
        label: "Leases",
        icon: LeasesIcon,
        id: "leases",
        href: "/manager/leases",
    },
    {
        label: "Payments",
        icon: PaymentsIcon,
        id: "payments",
        href: "/manager/payments",
    },
    {
        label: "Invoices",
        icon: InvoicesIcon,
        id: "invoices",
        href: "/manager/invoices",
    },
    // Accounting Submenu
    {
        label: "Accounting",
        icon: AccountingIcon,
        id: "accounting",
        isSubmenu: true,
        submenu: [
            {
                label: "Accounts",
                icon: InvoicesIcon,
                id: "accounts",
                href: "/manager/accounts",
            },
            {
                label: "Ledger",
                icon: InvoicesIcon,
                id: "ledger",
                href: "/manager/ledger",
            },
            {
                label: "Reports",
                icon: InvoicesIcon,
                id: "reports",
                href: "/manager/reports",
            },
            {
                label: "Receivables",
                icon: InvoicesIcon,
                id: "receivables",
                href: "/manager/receivables",
            },
            {
                label: "Reconciliation",
                icon: InvoicesIcon,
                id: "reconciliation",
                href: "/manager/reconciliation",
            },
            {
                label: "P&L Report",
                icon: InvoicesIcon,
                id: "plreport",
                href: "/manager/plreport",
            },
            {
                label: "Balance Sheet",
                icon: InvoicesIcon,
                id: "balancesheet",
                href: "/manager/balancesheet",
            },
            {
                label: "Cash Flow",
                icon: InvoicesIcon,
                id: "cashflow",
                href: "/manager/cashflow",
            },
            {
                label: "Tax & Withholding",
                icon: InvoicesIcon,
                id: "taxwithholding",
                href: "/manager/taxwithholding",
            },
            {
                label: "Export",
                icon: InvoicesIcon,
                id: "export",
                href: "/manager/export",
            },
            {
                label: "Bank & Cash",
                icon: InvoicesIcon,
                id: "bankcash",
                href: "/manager/bankcash",
            },
        ],
    },
    {
        label: "Staff",
        icon: StaffIcon,
        id: "staff",
        href: "/manager/staff",
    },
    {
        label: "Roles",
        icon: RolesIcon,
        id: "roles",
        href: "/manager/roles",
    },
    {
        label: "Audit Trail",
        icon: InvoicesIcon,
        id: "audittrail",
        href: "/manager/audittrail",
    },
    {
        label: "Integration",
        icon: InvoicesIcon,
        id: "integration",
        href: "/manager/integration",
    },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */
interface ManagerLayoutProps {
    children: React.ReactNode;
    title: string;
    activeNav: string;
    user: { name: string; email: string; role?: string };
    building: { id: number; name: string; address: string };
}

export default function ManagerLayout({
    children,
    title,
    activeNav,
    user,
    building,
}: ManagerLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [accountingSubmenuOpen, setAccountingSubmenuOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Accounting submenu items for checking active state
    const accountingSubmenuIds = [
        "accounts",
        "ledger",
        "reports",
        "receivables",
        "reconciliation",
        "plreport",
        "balancesheet",
        "cashflow",
        "taxwithholding",
        "export",
        "bankcash",
    ];

    // Auto-expand accounting submenu when a submenu item is active
    const isAccountingItemActive = accountingSubmenuIds.includes(activeNav);

    useEffect(() => {
        if (isAccountingItemActive) {
            setAccountingSubmenuOpen(true);
        }
    }, [activeNav, isAccountingItemActive]);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await axios.get("/manager/notifications");
            const notifs = Array.isArray(res.data.notifications)
                ? res.data.notifications
                : [];
            setNotifications(notifs);
            // Always recalculate unread count from notifications array
            setUnreadCount(notifs.filter((n: any) => !n.read_at).length);
        } catch {
            // silently ignore
        }
    }, []);

    // Poll notifications every 15 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                notifRef.current &&
                !notifRef.current.contains(e.target as Node)
            ) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        await axios.post(`/manager/notifications/${id}/read`);
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
            ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const markAllRead = async () => {
        await axios.post("/manager/notifications/read-all");
        setNotifications((prev) =>
            prev.map((n) => ({
                ...n,
                read_at: n.read_at || new Date().toISOString(),
            })),
        );
        setUnreadCount(0);
    };

    const timeAgo = (dateStr: string | null | undefined) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        const diff = Date.now() - date.getTime();
        if (diff < 0) return "";
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 66);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const handleLogout = () => {
        router.post("/logout");
    };

    return (
        <>
            <Head title={title} />
            <style>{`
                body { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="flex min-h-screen bg-slate-50">
                {/* ---- Sidebar ---- */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-[260px] transform border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
                        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
                        {/* Logo / Building */}
                        <div className="flex items-center gap-3 px-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                                <span className="text-lg font-bold">
                                    {building.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                                    Manager
                                </p>
                                <p
                                    className="text-sm font-bold text-slate-800 truncate"
                                    title={building.name}
                                >
                                    {building.name}
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="mt-8 space-y-1">
                            {navItems.map((item) => {
                                if (item.isSubmenu && item.submenu) {
                                    // Check if any submenu item is active
                                    const isSubmenuActive = item.submenu.some(
                                        (sub) => activeNav === sub.id,
                                    );
                                    return (
                                        <div key={item.id}>
                                            <button
                                                onClick={() =>
                                                    setAccountingSubmenuOpen(
                                                        !accountingSubmenuOpen,
                                                    )
                                                }
                                                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                                    isSubmenuActive
                                                        ? "bg-blue-50 text-blue-700 shadow-sm"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon
                                                        className={`h-[18px] w-[18px] ${
                                                            isSubmenuActive
                                                                ? "text-blue-600"
                                                                : "text-slate-400"
                                                        }`}
                                                    />
                                                    {item.label}
                                                </div>
                                                {accountingSubmenuOpen ? (
                                                    <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                                                )}
                                            </button>
                                            {accountingSubmenuOpen && (
                                                <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                                                    {item.submenu.map(
                                                        (subItem) => {
                                                            const active =
                                                                activeNav ===
                                                                subItem.id;
                                                            return (
                                                                <Link
                                                                    key={
                                                                        subItem.id
                                                                    }
                                                                    href={
                                                                        subItem.href
                                                                    }
                                                                    onClick={() =>
                                                                        setMobileMenuOpen(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                                                        active
                                                                            ? "bg-blue-50 text-blue-700 shadow-sm"
                                                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                                    }`}
                                                                >
                                                                    <subItem.icon
                                                                        className={`h-[16px] w-[16px] ${
                                                                            active
                                                                                ? "text-blue-600"
                                                                                : "text-slate-400"
                                                                        }`}
                                                                    />
                                                                    {
                                                                        subItem.label
                                                                    }
                                                                </Link>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                const active = activeNav === item.id;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                            active
                                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <item.icon
                                            className={`h-[18px] w-[18px] ${
                                                active
                                                    ? "text-blue-600"
                                                    : "text-slate-400"
                                            }`}
                                        />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Building info card */}
                        <div className="mt-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-lg shadow-blue-500/20">
                            <p className="text-sm font-bold">{building.name}</p>
                            <p className="mt-1 text-xs text-blue-100 leading-relaxed">
                                {building.address}
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Mobile overlay */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* ---- Main content ---- */}
                <div className="flex flex-1 flex-col min-w-0">
                    {/* Header */}
                    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                            {/* Left: hamburger */}
                            <button
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                            >
                                <MenuIcon className="h-5 w-5" />
                            </button>

                            <div className="hidden lg:block" />

                            {/* Right: actions */}
                            <div className="flex items-center gap-2">
                                {/* Notifications */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                        onClick={() =>
                                            setShowNotifications(
                                                !showNotifications,
                                            )
                                        }
                                    >
                                        <BellIcon className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
                                                {unreadCount > 99
                                                    ? "99+"
                                                    : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification dropdown */}
                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                                <h3 className="text-sm font-semibold text-slate-800">
                                                    Notifications
                                                </h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            <div className="max-h-80 overflow-y-auto scrollbar-hide">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                                                        No notifications yet
                                                    </div>
                                                ) : (
                                                    notifications.map((n) => (
                                                        <button
                                                            key={n.id}
                                                            onClick={() => {
                                                                if (!n.read_at)
                                                                    markAsRead(
                                                                        n.id,
                                                                    );
                                                                if (
                                                                    n.data
                                                                        .lease_id
                                                                ) {
                                                                    setShowNotifications(
                                                                        false,
                                                                    );
                                                                    router.visit(
                                                                        "/manager/leases",
                                                                    );
                                                                }
                                                            }}
                                                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                                                                !n.read_at
                                                                    ? "bg-blue-50/50"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div
                                                                className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                                                                    !n.read_at
                                                                        ? "bg-blue-500"
                                                                        : "bg-transparent"
                                                                }`}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm text-slate-700 leading-snug">
                                                                    {n.data &&
                                                                    typeof n
                                                                        .data
                                                                        .message ===
                                                                        "string" &&
                                                                    n.data.message.trim()
                                                                        ? n.data
                                                                              .message
                                                                        : "Notification details unavailable."}
                                                                </p>
                                                                <p className="mt-1 text-[11px] text-slate-400">
                                                                    {timeAgo(
                                                                        n.created_at,
                                                                    ) || ""}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

                                {/* User menu */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white shadow-sm">
                                        {user?.name
                                            ?.split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2) || "MG"}
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                                            {user?.name || "Manager"}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {user?.role || "Staff"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                        title="Log out"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                                                clipRule="evenodd"
                                            />
                                            <path
                                                fillRule="evenodd"
                                                d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page body */}
                    <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
