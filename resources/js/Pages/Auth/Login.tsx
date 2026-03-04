import React, { FormEvent, useState } from "react";
import { Head, useForm } from "@inertiajs/react";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post("/login");
    };

    return (
        <>
            <Head title="Sign in" />
            <style>{`
                body { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
            `}</style>

            <div className="flex min-h-screen">
                {/* Left — branding panel */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 flex-col justify-between p-12 text-white relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10" />
                    <div className="absolute bottom-12 right-12 h-64 w-64 rounded-full bg-white/5" />
                    <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-white/5" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <span className="text-xl font-bold">R</span>
                            </div>
                            <span className="text-xl font-semibold tracking-tight">
                                Rentals
                            </span>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <h1 className="text-4xl font-bold leading-tight">
                            Manage your
                            <br />
                            properties with
                            <br />
                            confidence.
                        </h1>
                        <p className="max-w-sm text-emerald-100 leading-relaxed">
                            Track buildings, assign managers, monitor
                            collections, and keep your entire portfolio healthy
                            — all from one dashboard.
                        </p>
                        <div className="flex gap-8 pt-4">
                            <div>
                                <p className="text-2xl font-bold">500+</p>
                                <p className="text-xs text-emerald-200 uppercase tracking-wider">
                                    Units Managed
                                </p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">98%</p>
                                <p className="text-xs text-emerald-200 uppercase tracking-wider">
                                    Collection Rate
                                </p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">24/7</p>
                                <p className="text-xs text-emerald-200 uppercase tracking-wider">
                                    Monitoring
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-emerald-200">
                        © {new Date().getFullYear()} Rentals. All rights
                        reserved.
                    </p>
                </div>

                {/* Right — login form */}
                <div className="flex flex-1 items-center justify-center bg-slate-50 px-6">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="mb-10 flex items-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <span className="text-lg font-bold">R</span>
                            </div>
                            <span className="text-xl font-semibold text-slate-900">
                                Rentals
                            </span>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Welcome back
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Sign in to your account to continue
                            </p>
                        </div>

                        <form onSubmit={submit} className="mt-8 space-y-5">
                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    className={`mt-1.5 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                                        errors.email
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-200 bg-white"
                                    }`}
                                    placeholder="you@company.com"
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className={`mt-1.5 block w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                                        errors.password
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-200 bg-white"
                                    }`}
                                    placeholder="••••••••"
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData(
                                                "remember",
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Remember me
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
                            >
                                {processing ? (
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                ) : null}
                                {processing ? "Signing in…" : "Sign in"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
