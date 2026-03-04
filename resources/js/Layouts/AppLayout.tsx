import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
function OverviewIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.293 2.293a1 1 0 011.414 0l6 6A1 1 0 0116 10h-2v6a1 1 0 01-1 1h-2v-4H9v4H7a1 1 0 01-1-1v-6H4a1 1 0 01-.707-1.707l6-6z" />
        </svg>
    );
}
function BuildingsIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
        </svg>
    );
}
function ManagersIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 4a3 3 0 110 6 3 3 0 010-6zm-6 12a6 6 0 0112 0v1H4v-1z" />
        </svg>
    );
}
function SettingsIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
            />
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
        label: "Overview",
        icon: OverviewIcon,
        id: "overview",
        href: "/dashboard",
    },
    {
        label: "Buildings",
        icon: BuildingsIcon,
        id: "buildings",
        href: "/buildings",
    },
    {
        label: "Managers",
        icon: ManagersIcon,
        id: "managers",
        href: "/managers",
    },
    {
        label: "Settings",
        icon: SettingsIcon,
        id: "settings",
        href: "/settings",
    },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */
interface AppLayoutProps {
    children: React.ReactNode;
    title: string;
    activeNav: string;
    user: { name: string; email: string };
}

export default function AppLayout({
    children,
    title,
    activeNav,
    user,
}: AppLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                        {/* Logo */}
                        <div className="flex items-center gap-3 px-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                                <span className="text-lg font-bold">R</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                                    Rentals
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                    Admin Console
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="mt-8 space-y-1">
                            {navItems.map((item) => {
                                const active = activeNav === item.id;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                            active
                                                ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <item.icon
                                            className={`h-[18px] w-[18px] ${
                                                active
                                                    ? "text-emerald-600"
                                                    : "text-slate-400"
                                            }`}
                                        />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* CTA card */}
                        <div className="mt-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
                            <p className="text-sm font-bold">
                                Need to onboard?
                            </p>
                            <p className="mt-1 text-xs text-emerald-100 leading-relaxed">
                                Invite managers and staff from the Managers tab.
                            </p>
                            <button className="mt-3 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/30">
                                Get started
                            </button>
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
                                <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                                    <BellIcon className="h-5 w-5" />
                                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                                        3
                                    </span>
                                </button>

                                <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

                                {/* User menu */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white shadow-sm">
                                        {user?.name
                                            ?.split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2) || "SA"}
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                                            {user?.name || "Admin"}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Super Admin
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
