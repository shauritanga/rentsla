import React from "react";
import { useForm } from "@inertiajs/react";
import ManagerLayout from "@/Layouts/ManagerLayout";

interface ManagerProfileProps {
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

export default function ManagerProfile({
    user,
    building,
}: ManagerProfileProps) {
    const { data, setData, put, processing, errors, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put("/manager/settings/profile");
    };

    return (
        <ManagerLayout
            title="My Profile"
            activeNav="profile"
            user={{ name: user.name, email: user.email, role: user.role }}
            building={building}
        >
            <div className="mx-auto max-w-4xl space-y-4">
                <Section
                    title="Profile Information"
                    description="Update your name and email in the manager portal."
                >
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-lg space-y-5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md">
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

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                                className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
                            >
                                {processing ? "Saving..." : "Save Changes"}
                            </button>
                            {recentlySuccessful && (
                                <span className="text-xs font-medium text-blue-600">
                                    Saved!
                                </span>
                            )}
                        </div>
                    </form>
                </Section>
            </div>
        </ManagerLayout>
    );
}
