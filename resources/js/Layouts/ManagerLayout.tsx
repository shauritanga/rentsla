import React, { useState, useEffect, useRef, useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    DashboardSpeed01Icon,
    FloorPlanIcon,
    Building01Icon,
    BookUserIcon,
    Agreement01Icon,
    CreditCardIcon,
    Invoice01Icon,
    AddTeamIcon,
    AiSecurity01Icon,
    Analytics01Icon,
    ArrowDown01Icon,
    ArrowRight01Icon,
    BellDotIcon,
    Moon01Icon,
    AiMail01Icon,
    UserCircle02Icon,
    Settings01Icon,
    Logout01Icon,
    Menu01Icon,
    Menu02Icon,
} from "@hugeicons/core-free-icons";

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
/*  Nav items                                                          */
/* ------------------------------------------------------------------ */
const navItems = [
    {
        label: "Dashboard",
        icon: DashboardSpeed01Icon,
        id: "dashboard",
        href: "/manager/dashboard",
    },
    {
        label: "Floors",
        icon: FloorPlanIcon,
        id: "floors",
        href: "/manager/floors",
    },
    {
        label: "Units",
        icon: Building01Icon,
        id: "units",
        href: "/manager/units",
    },
    {
        label: "Tenants",
        icon: BookUserIcon,
        id: "tenants",
        href: "/manager/tenants",
    },
    {
        label: "Leases",
        icon: Agreement01Icon,
        id: "leases",
        href: "/manager/leases",
    },
    {
        label: "Payments",
        icon: CreditCardIcon,
        id: "payments",
        href: "/manager/payments",
    },
    {
        label: "Invoices",
        icon: Invoice01Icon,
        id: "invoices",
        href: "/manager/invoices",
    },
    // Accounting Submenu
    {
        label: "Accounting",
        icon: Analytics01Icon,
        id: "accounting",
        isSubmenu: true,
        submenu: [
            {
                label: "Accounts",
                icon: Invoice01Icon,
                id: "accounts",
                href: "/manager/accounts",
            },
            {
                label: "Ledger",
                icon: Invoice01Icon,
                id: "ledger",
                href: "/manager/ledger",
            },
            {
                label: "Reports",
                icon: Invoice01Icon,
                id: "reports",
                href: "/manager/reports",
            },
            {
                label: "Receivables",
                icon: Invoice01Icon,
                id: "receivables",
                href: "/manager/receivables",
            },
            {
                label: "Reconciliation",
                icon: Invoice01Icon,
                id: "reconciliation",
                href: "/manager/reconciliation",
            },
            {
                label: "P&L Report",
                icon: Invoice01Icon,
                id: "plreport",
                href: "/manager/plreport",
            },
            {
                label: "Balance Sheet",
                icon: Invoice01Icon,
                id: "balancesheet",
                href: "/manager/balancesheet",
            },
            {
                label: "Cash Flow",
                icon: Invoice01Icon,
                id: "cashflow",
                href: "/manager/cashflow",
            },
            {
                label: "Tax & Withholding",
                icon: Invoice01Icon,
                id: "taxwithholding",
                href: "/manager/taxwithholding",
            },
            {
                label: "Export",
                icon: Invoice01Icon,
                id: "export",
                href: "/manager/export",
            },
            {
                label: "Bank & Cash",
                icon: Invoice01Icon,
                id: "bankcash",
                href: "/manager/bankcash",
            },
        ],
    },
    {
        label: "Staff",
        icon: AddTeamIcon,
        id: "staff",
        href: "/manager/staff",
    },
    {
        label: "Roles",
        icon: AiSecurity01Icon,
        id: "roles",
        href: "/manager/roles",
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
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [accountingSubmenuOpen, setAccountingSubmenuOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const userMenuCloseTimeoutRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);
    const isBuildingManager = user?.role === "Building Manager";

    const clearUserMenuCloseTimer = useCallback(() => {
        if (userMenuCloseTimeoutRef.current) {
            clearTimeout(userMenuCloseTimeoutRef.current);
            userMenuCloseTimeoutRef.current = null;
        }
    }, []);

    const openUserMenu = useCallback(() => {
        clearUserMenuCloseTimer();
        setShowUserMenu(true);
    }, [clearUserMenuCloseTimer]);

    const closeUserMenuWithDelay = useCallback(() => {
        clearUserMenuCloseTimer();
        userMenuCloseTimeoutRef.current = setTimeout(() => {
            setShowUserMenu(false);
            userMenuCloseTimeoutRef.current = null;
        }, 180);
    }, [clearUserMenuCloseTimer]);

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

            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target as Node)
            ) {
                clearUserMenuCloseTimer();
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [clearUserMenuCloseTimer]);

    useEffect(() => {
        return () => {
            clearUserMenuCloseTimer();
        };
    }, [clearUserMenuCloseTimer]);

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
                                                    <HugeiconsIcon
                                                        icon={item.icon}
                                                        className={`h-[18px] w-[18px] ${
                                                            isSubmenuActive
                                                                ? "text-blue-600"
                                                                : "text-slate-400"
                                                        }`}
                                                    />
                                                    {item.label}
                                                </div>
                                                {accountingSubmenuOpen ? (
                                                    <HugeiconsIcon
                                                        icon={ArrowDown01Icon}
                                                        className="h-4 w-4 text-slate-400"
                                                    />
                                                ) : (
                                                    <HugeiconsIcon
                                                        icon={ArrowRight01Icon}
                                                        className="h-4 w-4 text-slate-400"
                                                    />
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
                                                                    <HugeiconsIcon
                                                                        icon={
                                                                            subItem.icon
                                                                        }
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
                                        <HugeiconsIcon
                                            icon={item.icon}
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

                        {/* Fixed bottom settings (building manager only) */}
                        {isBuildingManager && (
                            <Link
                                href="/manager/settings"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`mt-auto flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                    activeNav === "settings"
                                        ? "bg-blue-50 text-blue-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <HugeiconsIcon
                                    icon={Settings01Icon}
                                    className={`h-[18px] w-[18px] ${
                                        activeNav === "settings"
                                            ? "text-blue-600"
                                            : "text-slate-400"
                                    }`}
                                />
                                Settings
                            </Link>
                        )}
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
                    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100/95 backdrop-blur-sm">
                        <div className="flex h-20 items-center justify-between px-4 sm:px-6">
                            {/* Left: menu + title */}
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700 transition"
                                    onClick={() =>
                                        setMobileMenuOpen(!mobileMenuOpen)
                                    }
                                >
                                    <HugeiconsIcon
                                        icon={Menu02Icon}
                                        className="h-5 w-5"
                                    />
                                </button>
                                <h1 className="truncate text-xl font-bold text-slate-700 tracking-tight">
                                    {title}
                                </h1>
                            </div>

                            {/* Right: actions */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700 transition"
                                    title="Appearance"
                                    aria-label="Appearance"
                                >
                                    <HugeiconsIcon
                                        icon={Moon01Icon}
                                        className="h-5 w-5"
                                    />
                                </button>

                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700 transition"
                                    title="Messages"
                                    aria-label="Messages"
                                >
                                    <HugeiconsIcon
                                        icon={AiMail01Icon}
                                        className="h-5 w-5"
                                    />
                                </button>

                                {/* Notifications */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        className="relative rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700 transition"
                                        onClick={() =>
                                            setShowNotifications(
                                                !showNotifications,
                                            )
                                        }
                                    >
                                        <HugeiconsIcon
                                            icon={BellDotIcon}
                                            className="h-5 w-5"
                                        />
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

                                <div className="mx-1 hidden h-8 w-px bg-slate-300 sm:block" />

                                {/* User menu */}
                                <div
                                    className="relative"
                                    ref={userMenuRef}
                                    onMouseEnter={openUserMenu}
                                    onMouseLeave={closeUserMenuWithDelay}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowUserMenu((prev) => {
                                                clearUserMenuCloseTimer();
                                                return !prev;
                                            })
                                        }
                                        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white"
                                    >
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                                                {user?.name || "Manager User"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {user?.role || "staff"}
                                            </p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm">
                                            {user?.name
                                                ?.split(" ")
                                                .map((n: string) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2) || "MG"}
                                        </div>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 top-full z-50 pt-2">
                                            <div className="w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                                <Link
                                                    href="/manager/profile"
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    <HugeiconsIcon
                                                        icon={UserCircle02Icon}
                                                        className="h-4 w-4 text-slate-500"
                                                    />
                                                    My Profile
                                                </Link>
                                                {isBuildingManager && (
                                                    <Link
                                                        href="/manager/settings"
                                                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <HugeiconsIcon
                                                            icon={
                                                                Settings01Icon
                                                            }
                                                            className="h-4 w-4 text-slate-500"
                                                        />
                                                        Settings
                                                    </Link>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                                >
                                                    <HugeiconsIcon
                                                        icon={Logout01Icon}
                                                        className="h-4 w-4"
                                                    />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
