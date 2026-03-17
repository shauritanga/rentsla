import React from "react";
import { useForm } from "@inertiajs/react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import SettingsTabs from "@/Pages/Manager/components/SettingsTabs";

interface ManagerSettingsProps {
    user: {
        id: number;
        name: string;
        email: string;
        role?: string;
        created_at: string;
    };
    building: {
        id: number;
        name: string;
        address: string;
    };
}

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put("/manager/settings/password", {
            onSuccess: () => reset(),
        });
    };

    return (
        <Section
            title="Security Settings"
            description="Change your password for manager portal access."
        >
            <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Current Password
                    </label>
                    <input
                        type="password"
                        value={data.current_password}
                        onChange={(e) =>
                            setData("current_password", e.target.value)
                        }
                        placeholder="Enter current password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.current_password && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.current_password}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        New Password
                    </label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        placeholder="Re-enter new password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                        className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
                    >
                        {processing ? "Updating..." : "Update Password"}
                    </button>
                    {recentlySuccessful && (
                        <span className="text-xs font-medium text-blue-600">
                            Password updated!
                        </span>
                    )}
                </div>
            </form>
        </Section>
    );
}

export default function ManagerSettings({
    user,
    building,
}: ManagerSettingsProps) {
    const isBuildingManager = user?.role === "Building Manager";

    return (
        <ManagerLayout
            title="Settings"
            activeNav="settings"
            user={{ name: user.name, email: user.email, role: user.role }}
            building={building}
        >
            <div className="mx-auto max-w-4xl space-y-4">
                <SettingsTabs
                    activeTab="security"
                    isBuildingManager={isBuildingManager}
                />
                <PasswordForm />
            </div>
        </ManagerLayout>
    );
}
