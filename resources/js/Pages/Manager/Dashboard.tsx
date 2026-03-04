import React from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Stats {
    total_floors: number;
    total_units: number;
    occupied_units: number;
    vacant_units: number;
    occupancy_rate: number;
    active_leases: number;
    total_tenants: number;
    monthly_revenue: number;
    collected_this_month: number;
}

interface FloorBreakdown {
    id: number;
    name: string;
    total_units: number;
    occupied: number;
    vacant: number;
}

interface RecentPayment {
    id: number;
    tenant: string;
    unit: string;
    amount: number;
    date: string;
    method: string;
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    stats: Stats;
    recentPayments: RecentPayment[];
    floors: FloorBreakdown[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency: "TZS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Dashboard({
    user,
    building,
    stats,
    recentPayments,
    floors,
}: Props) {
    const kpis = [
        {
            label: "Total Floors",
            value: stats.total_floors,
            color: "from-blue-500 to-blue-600",
            shadow: "shadow-blue-500/20",
            icon: (
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V9zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                </svg>
            ),
        },
        {
            label: "Total Units",
            value: stats.total_units,
            color: "from-indigo-500 to-indigo-600",
            shadow: "shadow-indigo-500/20",
            icon: (
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
                </svg>
            ),
        },
        {
            label: "Occupied",
            value: stats.occupied_units,
            color: "from-emerald-500 to-emerald-600",
            shadow: "shadow-emerald-500/20",
            icon: (
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
        {
            label: "Vacant",
            value: stats.vacant_units,
            color: "from-amber-500 to-amber-600",
            shadow: "shadow-amber-500/20",
            icon: (
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
        {
            label: "Occupancy Rate",
            value: `${stats.occupancy_rate}%`,
            color: "from-cyan-500 to-cyan-600",
            shadow: "shadow-cyan-500/20",
            icon: (
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
        {
            label: "Monthly Revenue",
            value: formatCurrency(stats.monthly_revenue),
            color: "from-violet-500 to-violet-600",
            shadow: "shadow-violet-500/20",
            icon: (
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm12-1a1 1 0 11-2 0 1 1 0 012 0zM2 15.25h16a.75.75 0 010 1.5H2a.75.75 0 010-1.5z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
        },
    ];

    return (
        <ManagerLayout
            title="Building Dashboard"
            activeNav="dashboard"
            user={user}
            building={building}
        >
            {/* Page heading */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Overview of {building.name}
                </p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
                    >
                        <div
                            className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-lg ${kpi.shadow}`}
                        >
                            {kpi.icon}
                        </div>
                        <p className="text-lg font-bold text-slate-900">
                            {kpi.value}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {kpi.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Collection progress */}
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            Monthly Collection
                        </h2>
                        <p className="text-xs text-slate-500">
                            {new Date().toLocaleString("default", {
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(stats.collected_this_month)}
                        </p>
                        <p className="text-xs text-slate-500">
                            of {formatCurrency(stats.monthly_revenue)} expected
                        </p>
                    </div>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                        style={{
                            width: `${
                                stats.monthly_revenue > 0
                                    ? Math.min(
                                          (stats.collected_this_month /
                                              stats.monthly_revenue) *
                                              100,
                                          100,
                                      )
                                    : 0
                            }%`,
                        }}
                    />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                    {stats.monthly_revenue > 0
                        ? Math.round(
                              (stats.collected_this_month /
                                  stats.monthly_revenue) *
                                  100,
                          )
                        : 0}
                    % collected
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Floor breakdown */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <h2 className="text-base font-bold text-slate-900 mb-4">
                        Floor Breakdown
                    </h2>
                    {floors.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">
                            No floors added yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {floors.map((floor) => (
                                <div
                                    key={floor.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {floor.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {floor.total_units} units
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            {floor.occupied}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            {floor.vacant}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent payments */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <h2 className="text-base font-bold text-slate-900 mb-4">
                        Recent Payments
                    </h2>
                    {recentPayments.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">
                            No payments recorded yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentPayments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {payment.tenant}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Unit {payment.unit} &middot;{" "}
                                            {payment.date}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                        <p className="text-xs text-slate-400 capitalize">
                                            {payment.method.replace("_", " ")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
}
