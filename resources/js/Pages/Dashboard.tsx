import React from "react";
import AppLayout from "@/Layouts/AppLayout";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface User {
    name: string;
    email: string;
}

interface DashboardProps {
    user: User;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
function BuildingsIcon({ className = "" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
    label,
    value,
    meta,
    accent,
    icon,
}: {
    label: string;
    value: string;
    meta: string;
    accent: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition">
                    {icon}
                </div>
            </div>
            <p className={`mt-3 text-xs font-medium ${accent}`}>{meta}</p>
        </div>
    );
}

function ManagerRow({
    name,
    building,
    status,
    tone,
    avatar,
}: {
    name: string;
    building: string;
    status: string;
    tone: "emerald" | "orange";
    avatar: string;
}) {
    const badge =
        tone === "emerald"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
            : "bg-amber-50 text-amber-700 ring-amber-600/20";

    return (
        <div className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-slate-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">
                {avatar}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                    {name}
                </p>
                <p className="text-xs text-slate-500 truncate">{building}</p>
            </div>
            <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${badge}`}
            >
                {status}
            </span>
        </div>
    );
}

function ActivityRow({
    title,
    meta,
    type,
}: {
    title: string;
    meta: string;
    type: "success" | "warning" | "info";
}) {
    const dotColor = {
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        info: "bg-blue-500",
    };

    return (
        <div className="flex gap-3 rounded-xl p-3 transition hover:bg-slate-50">
            <div className="mt-1.5 flex-shrink-0">
                <div className={`h-2 w-2 rounded-full ${dotColor[type]}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Page                                                */
/* ------------------------------------------------------------------ */
/* ===================== Chart Data ===================== */

const collectionsData = [
    { month: "Aug", amount: 36 },
    { month: "Sep", amount: 39 },
    { month: "Oct", amount: 42 },
    { month: "Nov", amount: 40 },
    { month: "Dec", amount: 45 },
    { month: "Jan", amount: 48 },
];

const buildingComparisonData = [
    { name: "Ocean View", collections: 8.2, overdue: 0.42 },
    { name: "Harbor Hts", collections: 4.1, overdue: 1.7 },
    { name: "Sunrise", collections: 3.4, overdue: 0 },
    { name: "Bahari", collections: 5.8, overdue: 0.6 },
    { name: "Palm Court", collections: 6.9, overdue: 0.3 },
];

const occupancyData = [
    { name: "Ocean View", value: 96 },
    { name: "Harbor Hts", value: 78 },
    { name: "Sunrise", value: 100 },
    { name: "Bahari", value: 88 },
    { name: "Palm Court", value: 92 },
];

const occupancyTrendData = [
    { month: "Aug", oceanView: 91, harbor: 72, sunrise: 98 },
    { month: "Sep", oceanView: 92, harbor: 74, sunrise: 99 },
    { month: "Oct", oceanView: 94, harbor: 73, sunrise: 100 },
    { month: "Nov", oceanView: 93, harbor: 76, sunrise: 100 },
    { month: "Dec", oceanView: 95, harbor: 77, sunrise: 100 },
    { month: "Jan", oceanView: 96, harbor: 78, sunrise: 100 },
];

const DONUT_COLORS = ["#059669", "#f59e0b", "#6366f1", "#0ea5e9", "#ec4899"];

export default function Dashboard({ user }: DashboardProps) {
    return (
        <AppLayout title="Dashboard" activeNav="overview" user={user}>
            {/* Breadcrumb + building filter */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <nav className="flex items-center gap-1 text-xs text-slate-400">
                    <span>Dashboard</span>
                    <svg
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span className="text-slate-600 font-medium">Overview</span>
                </nav>

                <div className="flex items-center gap-2">
                    <label
                        htmlFor="building-filter"
                        className="text-xs font-medium text-slate-500"
                    >
                        Building:
                    </label>
                    <select
                        id="building-filter"
                        className="h-8 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                    >
                        <option value="">All Buildings</option>
                        <option value="ocean-view">Ocean View Towers</option>
                        <option value="harbor-heights">Harbor Heights</option>
                        <option value="sunrise-annex">Sunrise Annex</option>
                    </select>
                </div>
            </div>

            {/* KPI cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Buildings"
                    value="12"
                    meta="+ 2 this month"
                    accent="text-emerald-600"
                    icon={<BuildingsIcon className="h-5 w-5" />}
                />
                <StatCard
                    label="Total Units"
                    value="482"
                    meta="94% occupied"
                    accent="text-emerald-600"
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM4.5 4A.5.5 0 004 4.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Overdue"
                    value="18"
                    meta="TZS 6.2M outstanding"
                    accent="text-orange-600"
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                    }
                />
                <StatCard
                    label="Collections"
                    value="TZS 48M"
                    meta="+ 6% MoM"
                    accent="text-emerald-600"
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M10.75 10.818a4.5 4.5 0 01-1.5 0V6a.75.75 0 011.5 0v4.818zM10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
                        </svg>
                    }
                />
            </section>

            {/* Charts Row 1: Collections Trend + Collections vs Overdue */}
            <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                {/* Line chart — Monthly Collections Trend */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Collections Trend
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Monthly rent collections over the last 6 months
                            </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            +6% MoM
                        </span>
                    </div>
                    <div className="h-[280px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={collectionsData}>
                                <defs>
                                    <linearGradient
                                        id="colorCollections"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#059669"
                                            stopOpacity={0.15}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#059669"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f1f5f9"
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{
                                        fontSize: 11,
                                        fill: "#94a3b8",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{
                                        fontSize: 11,
                                        fill: "#94a3b8",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}M`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "12px",
                                    }}
                                    formatter={(value: any) => [
                                        `TZS ${value}M`,
                                        "Collections",
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#059669"
                                    strokeWidth={2.5}
                                    fill="url(#colorCollections)"
                                    dot={{
                                        r: 4,
                                        fill: "#059669",
                                        strokeWidth: 2,
                                        stroke: "#fff",
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut chart — Occupancy by Building */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">
                        Occupancy Rate
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Unit occupancy across buildings
                    </p>
                    <div className="h-[280px] mt-4 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={occupancyData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {occupancyData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                DONUT_COLORS[
                                                    index % DONUT_COLORS.length
                                                ]
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "12px",
                                    }}
                                    formatter={(value: any) => [
                                        `${value}%`,
                                        "Occupancy",
                                    ]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value: any) => (
                                        <span className="text-xs text-slate-600 ml-1">
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Charts Row 2: Bar chart + Occupancy Trend */}
            <section className="mt-6 grid gap-6 xl:grid-cols-2">
                {/* Bar chart — Collections vs Overdue per Building */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">
                        Collections vs Overdue
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Per-building comparison (TZS Millions)
                    </p>
                    <div className="h-[280px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={buildingComparisonData} barGap={4}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f1f5f9"
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{
                                        fontSize: 11,
                                        fill: "#94a3b8",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{
                                        fontSize: 11,
                                        fill: "#94a3b8",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}M`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "12px",
                                    }}
                                    formatter={(value: any) => [
                                        `TZS ${value}M`,
                                    ]}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{
                                        fontSize: "11px",
                                        paddingBottom: "8px",
                                    }}
                                />
                                <Bar
                                    dataKey="collections"
                                    name="Collections"
                                    fill="#059669"
                                    radius={[6, 6, 0, 0]}
                                    barSize={28}
                                />
                                <Bar
                                    dataKey="overdue"
                                    name="Overdue"
                                    fill="#f59e0b"
                                    radius={[6, 6, 0, 0]}
                                    barSize={28}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line chart — Occupancy Trend */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">
                        Occupancy Trend
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Average occupancy rate over 6 months
                    </p>
                    <div className="h-[280px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={occupancyTrendData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f1f5f9"
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{
                                        fontSize: 11,
                                        fill: "#94a3b8",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[70, 100]}
                                    tick={{
                                        fontSize: 11,
                                        fill: "#94a3b8",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        fontSize: "12px",
                                    }}
                                    formatter={(value: any) => [`${value}%`]}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{
                                        fontSize: "11px",
                                        paddingBottom: "8px",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="oceanView"
                                    name="Ocean View"
                                    stroke="#059669"
                                    strokeWidth={2}
                                    dot={{
                                        r: 3.5,
                                        fill: "#059669",
                                        strokeWidth: 2,
                                        stroke: "#fff",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="harbor"
                                    name="Harbor Heights"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={{
                                        r: 3.5,
                                        fill: "#f59e0b",
                                        strokeWidth: 2,
                                        stroke: "#fff",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sunrise"
                                    name="Sunrise Annex"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{
                                        r: 3.5,
                                        fill: "#6366f1",
                                        strokeWidth: 2,
                                        stroke: "#fff",
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Bottom grid */}
            <section className="mt-6 grid gap-6 xl:grid-cols-2">
                {/* Managers */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Managers
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Each building has an assigned manager
                            </p>
                        </div>
                        <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">
                            View all
                        </button>
                    </div>
                    <div className="mt-4 space-y-1">
                        <ManagerRow
                            name="Ann Joseph"
                            building="Ocean View Towers"
                            status="Stable"
                            tone="emerald"
                            avatar="AJ"
                        />
                        <ManagerRow
                            name="Kevin Paulo"
                            building="Harbor Heights"
                            status="Attention"
                            tone="orange"
                            avatar="KP"
                        />
                        <ManagerRow
                            name="Asha Nuru"
                            building="Sunrise Annex"
                            status="Stable"
                            tone="emerald"
                            avatar="AN"
                        />
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Recent Activity
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Latest updates across all buildings
                            </p>
                        </div>
                        <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">
                            View all
                        </button>
                    </div>
                    <div className="mt-4 space-y-1">
                        <ActivityRow
                            title="Lease onboarding approved"
                            meta="Unit 5B · Ocean View Towers · 20 min ago"
                            type="success"
                        />
                        <ActivityRow
                            title="Maintenance request assigned"
                            meta="Elevator · Harbor Heights · 2 hours ago"
                            type="warning"
                        />
                        <ActivityRow
                            title="Collections cleared"
                            meta="TZS 1.4M · Sunrise Annex · Yesterday"
                            type="info"
                        />
                        <ActivityRow
                            title="New tenant registered"
                            meta="Unit 3A · Ocean View Towers · Yesterday"
                            type="success"
                        />
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}
