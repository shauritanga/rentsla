import React, { useState } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Payment {
    id: number;
    tenant: string;
    unit: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference: string | null;
    month_covered: string;
    notes: string | null;
    received_by: string;
}

interface ActiveLease {
    id: number;
    tenant: string;
    unit: string;
    monthly_rent: number;
}

interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    payments: PaginatedPayments;
    activeLeases: ActiveLease[];
    stats: {
        collected_this_month: number;
        expected_revenue: number;
        collection_rate: number;
        total_payments: number;
    };
    filters: { search: string; month: string };
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

function formatMonth(ym: string) {
    const [y, m] = ym.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Payments({
    user,
    building,
    payments,
    activeLeases,
    stats,
    filters,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const [monthFilter, setMonthFilter] = useState(filters.month);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const form = useForm({
        lease_id: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        reference: "",
        month_covered: currentMonth,
        notes: "",
    });

    function applyFilters() {
        router.get(
            "/manager/payments",
            {
                search: search || undefined,
                month: monthFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function clearFilters() {
        setSearch("");
        setMonthFilter(currentMonth);
        router.get(
            "/manager/payments",
            { month: currentMonth },
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        form.setData({
            lease_id: activeLeases[0]?.id?.toString() || "",
            amount: "",
            payment_date: new Date().toISOString().split("T")[0],
            payment_method: "cash",
            reference: "",
            month_covered: currentMonth,
            notes: "",
        });
        form.clearErrors();
        setShowModal(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post("/manager/payments", {
            onSuccess: () => setShowModal(false),
        });
    }

    // Auto-fill amount when lease is selected
    function handleLeaseChange(leaseId: string) {
        form.setData("lease_id", leaseId);
        const lease = activeLeases.find((l) => l.id.toString() === leaseId);
        if (lease && !form.data.amount) {
            form.setData("amount", lease.monthly_rent.toString());
        }
    }

    return (
        <ManagerLayout
            title="Payments"
            activeNav="payments"
            user={user}
            building={building}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Payments
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Record and track rent payments
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={activeLeases.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Record Payment
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(stats.collected_this_month)}
                    </p>
                    <p className="text-xs text-slate-500">
                        Collected This Month
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(stats.expected_revenue)}
                    </p>
                    <p className="text-xs text-slate-500">Expected Revenue</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-lg font-bold text-indigo-600">
                        {stats.collection_rate}%
                    </p>
                    <p className="text-xs text-slate-500">Collection Rate</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-lg font-bold text-slate-800">
                        {stats.total_payments}
                    </p>
                    <p className="text-xs text-slate-500">Total Records</p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Search
                    </label>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                        placeholder="Reference, tenant, unit..."
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition w-48"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Month
                    </label>
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                </div>
                <button
                    onClick={applyFilters}
                    className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                    Filter
                </button>
                {(filters.search || filters.month !== currentMonth) && (
                    <button
                        onClick={clearFilters}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Tenant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Unit
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Reference
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-12 text-center text-sm text-slate-400"
                                >
                                    No payments found.
                                </td>
                            </tr>
                        ) : (
                            payments.data.map((payment) => (
                                <tr
                                    key={payment.id}
                                    className="hover:bg-slate-50/50 transition"
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                        {payment.tenant}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {payment.unit}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                                        {formatCurrency(payment.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {payment.payment_date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 capitalize">
                                            {payment.payment_method.replace(
                                                "_",
                                                " ",
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {formatMonth(payment.month_covered)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {payment.reference || "—"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {payments.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {payments.links.map((link, i) => (
                        <button
                            key={i}
                            disabled={!link.url}
                            onClick={() =>
                                link.url &&
                                router.get(
                                    link.url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                link.active
                                    ? "bg-blue-50 text-blue-700"
                                    : link.url
                                      ? "text-slate-600 hover:bg-slate-100"
                                      : "text-slate-300 cursor-not-allowed"
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            {/* Record Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">
                            Record Payment
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Lease */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Lease (Tenant – Unit)
                                </label>
                                <select
                                    value={form.data.lease_id}
                                    onChange={(e) =>
                                        handleLeaseChange(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    <option value="">Select lease</option>
                                    {activeLeases.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.tenant} – Unit {l.unit} (
                                            {formatCurrency(l.monthly_rent)})
                                        </option>
                                    ))}
                                </select>
                                {form.errors.lease_id && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.lease_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Amount (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.data.amount}
                                        onChange={(e) =>
                                            form.setData(
                                                "amount",
                                                e.target.value,
                                            )
                                        }
                                        min="0.01"
                                        step="100"
                                        placeholder="500000"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                    {form.errors.amount && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {form.errors.amount}
                                        </p>
                                    )}
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.data.payment_date}
                                        onChange={(e) =>
                                            form.setData(
                                                "payment_date",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                    {form.errors.payment_date && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {form.errors.payment_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Method */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        value={form.data.payment_method}
                                        onChange={(e) =>
                                            form.setData(
                                                "payment_method",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">
                                            Bank Transfer
                                        </option>
                                        <option value="mobile_money">
                                            Mobile Money
                                        </option>
                                    </select>
                                    {form.errors.payment_method && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {form.errors.payment_method}
                                        </p>
                                    )}
                                </div>

                                {/* Month covered */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Month Covered
                                    </label>
                                    <input
                                        type="month"
                                        value={form.data.month_covered}
                                        onChange={(e) =>
                                            form.setData(
                                                "month_covered",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                    {form.errors.month_covered && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {form.errors.month_covered}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Reference */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Reference (optional)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.reference}
                                    onChange={(e) =>
                                        form.setData(
                                            "reference",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Transaction ID, receipt no..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData("notes", e.target.value)
                                    }
                                    rows={2}
                                    placeholder="Additional notes..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50"
                                >
                                    {form.processing
                                        ? "Saving..."
                                        : "Record Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
