import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SettingsPageProps {
    user: {
        id: number;
        name: string;
        email: string;
        created_at: string;
    };
    app: {
        name: string;
        timezone: string;
    };
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="mt-0.5 text-xs text-slate-400">{description}</p>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Profile Form                                                       */
/* ------------------------------------------------------------------ */
function ProfileForm({ user }: { user: SettingsPageProps["user"] }) {
    const { data, setData, put, processing, errors, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put("/settings/profile");
    };

    return (
        <Section
            title="Profile Information"
            description="Update your name and email address."
        >
            <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
                {/* Avatar preview */}
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white shadow-md">
                        {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            {user.name}
                        </p>
                        <p className="text-xs text-slate-400">
                            Member since {user.created_at}
                        </p>
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition"
                    >
                        {processing ? "Saving..." : "Save Changes"}
                    </button>
                    {recentlySuccessful && (
                        <span className="text-xs font-medium text-emerald-600">
                            Saved!
                        </span>
                    )}
                </div>
            </form>
        </Section>
    );
}

/* ------------------------------------------------------------------ */
/*  Password Form                                                      */
/* ------------------------------------------------------------------ */
function PasswordForm() {
    const {
        data,
        setData,
        put,
        processing,
        errors,
        reset,
        recentlySuccessful,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const [showPasswords, setShowPasswords] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put("/settings/password", {
            onSuccess: () => reset(),
        });
    };

    return (
        <Section
            title="Change Password"
            description="Ensure your account uses a strong, unique password."
        >
            <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
                {/* Current */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Current Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords ? "text" : "password"}
                            value={data.current_password}
                            onChange={(e) =>
                                setData("current_password", e.target.value)
                            }
                            placeholder="Enter current password"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPasswords ? (
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                                        clipRule="evenodd"
                                    />
                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                </svg>
                            ) : (
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                    {errors.current_password && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.current_password}
                        </p>
                    )}
                </div>

                {/* New */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        New Password
                    </label>
                    <input
                        type={showPasswords ? "text" : "password"}
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    />
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.password}
                        </p>
                    )}
                </div>

                {/* Confirm */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Confirm New Password
                    </label>
                    <input
                        type={showPasswords ? "text" : "password"}
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    />
                    {errors.password_confirmation && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.password_confirmation}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition"
                    >
                        {processing ? "Updating..." : "Update Password"}
                    </button>
                    {recentlySuccessful && (
                        <span className="text-xs font-medium text-emerald-600">
                            Password updated!
                        </span>
                    )}
                </div>
            </form>
        </Section>
    );
}

/* ------------------------------------------------------------------ */
/*  Danger Zone                                                        */
/* ------------------------------------------------------------------ */
function DangerZone() {
    return (
        <div className="rounded-2xl border border-red-200/60 bg-white shadow-sm">
            <div className="border-b border-red-100 px-6 py-5">
                <h2 className="text-base font-bold text-red-600">
                    Danger Zone
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                    Irreversible and destructive actions.
                </p>
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Delete Account
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Permanently remove your account and all associated
                            data. This cannot be undone.
                        </p>
                    </div>
                    <button
                        disabled
                        className="shrink-0 rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title="Contact system administrator"
                    >
                        Contact Admin
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Info Card                                                          */
/* ------------------------------------------------------------------ */
function InfoCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    {label}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                    {value}
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SettingsPage({ user, app }: SettingsPageProps) {
    const [activeTab, setActiveTab] = useState<
        "profile" | "security" | "about"
    >("profile");

    const tabs = [
        { id: "profile" as const, label: "Profile" },
        { id: "security" as const, label: "Security" },
        { id: "about" as const, label: "About" },
    ];

    return (
        <AppLayout title="Settings" activeNav="settings" user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        Settings
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        Manage your account preferences and security.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1 max-w-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                                activeTab === tab.id
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === "profile" && (
                    <div className="space-y-6">
                        <ProfileForm user={user} />
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="space-y-6">
                        <PasswordForm />
                        <DangerZone />
                    </div>
                )}

                {activeTab === "about" && (
                    <div className="space-y-6">
                        <Section
                            title="Application Information"
                            description="Details about the platform."
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoCard
                                    label="Platform"
                                    value="Rentals"
                                    icon={
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
                                        </svg>
                                    }
                                />
                                <InfoCard
                                    label="Version"
                                    value="1.0.0"
                                    icon={
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    }
                                />
                                <InfoCard
                                    label="Timezone"
                                    value={app.timezone}
                                    icon={
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    }
                                />
                                <InfoCard
                                    label="Environment"
                                    value="Production"
                                    icon={
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    }
                                />
                            </div>
                        </Section>

                        <Section
                            title="System Details"
                            description="Technical information about the stack."
                        >
                            <div className="space-y-3">
                                {[
                                    {
                                        label: "Framework",
                                        value: "Laravel 12",
                                    },
                                    {
                                        label: "Frontend",
                                        value: "React 19 + TypeScript",
                                    },
                                    {
                                        label: "Database",
                                        value: "PostgreSQL",
                                    },
                                    {
                                        label: "CSS",
                                        value: "Tailwind CSS v4",
                                    },
                                    {
                                        label: "Adapter",
                                        value: "Inertia.js v2",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between rounded-lg px-3 py-2.5 odd:bg-slate-50/80"
                                    >
                                        <span className="text-xs font-medium text-slate-500">
                                            {item.label}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700">
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
