import React, { useState } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm, Link } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ActiveLease {
    id: number;
    tenant_id: number;
    tenant: string;
    unit: string;
    monthly_rent: number;
    deposit_amount: number;
    rent_currency: string;
    billing_cycle_months: number;
    start_date: string;
    fitout_applicable?: boolean;
    fitout_start_date?: string | null;
    fitout_end_date?: string | null;
}

interface Invoice {
    id: number;
    invoice_number: string;
    proforma_number: string | null;
    type: "proforma" | "invoice";
    status: string;
    tenant: string;
    unit: string;
    period_start: string;
    period_end: string;
    billing_months: number;
    rent_amount: number;
    total_amount: number;
    amount_paid: number;
    balance: number;
    currency: string;
    issue_date: string;
    due_date: string;
    created_by: string;
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    user: { name: string; email: string; role?: string };
    building: { id: number; name: string; address: string };
    invoices: PaginatedInvoices;
    activeLeases: ActiveLease[];
    stats: {
        total_invoiced: number;
        total_paid: number;
        outstanding: number;
        overdue_count: number;
    };
    filters: { search: string; type: string; status: string };
}

interface AdditionalItem {
    description: string;
    amount: string;
    item_type: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatCurrency(amount: number, currency = "TZS") {
    return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    overdue: "bg-red-50 text-red-700",
    cancelled: "bg-slate-100 text-slate-400 line-through",
};

const typeColors: Record<string, string> = {
    proforma: "bg-purple-50 text-purple-700",
    invoice: "bg-blue-50 text-blue-700",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Invoices({
    user,
    building,
    invoices,
    activeLeases,
    stats,
    filters,
}: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const [filterType, setFilterType] = useState(filters.type);
    const [filterStatus, setFilterStatus] = useState(filters.status);
    const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>(
        [],
    );

    const createForm = useForm({
        lease_id: "",
        type: "invoice" as "proforma" | "invoice",
        billing_months: "3",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: "",
        period_start: "",
        service_charge_rate: "5",
        withholding_tax_rate: "10",
        notes: "",
        additional_items: [] as {
            description: string;
            amount: number;
            item_type: string;
        }[],
    });

    // Selected lease for auto-fill
    const selectedLease = activeLeases.find(
        (l) => l.id === Number(createForm.data.lease_id),
    );

    // Calculations
    const monthlyRent = selectedLease?.monthly_rent ?? 0;
    const billingMonths = Number(createForm.data.billing_months) || 3;
    const rentAmount = monthlyRent * billingMonths;
    const serviceChargeRate = Number(createForm.data.service_charge_rate) || 0;
    const serviceChargeAmount =
        Math.round(rentAmount * serviceChargeRate) / 100;
    const additionalTotal = additionalItems.reduce(
        (sum, it) => sum + (Number(it.amount) || 0),
        0,
    );
    const subtotal = rentAmount + serviceChargeAmount + additionalTotal;
    const withholdingTaxRate =
        Number(createForm.data.withholding_tax_rate) || 0;
    const withholdingTaxAmount =
        Math.round(rentAmount * withholdingTaxRate) / 100;
    const totalAmount = subtotal - withholdingTaxAmount;

    function applyFilters() {
        router.get(
            "/manager/invoices",
            {
                search: search || undefined,
                type: filterType || undefined,
                status: filterStatus || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        createForm.reset();
        createForm.clearErrors();
        setAdditionalItems([]);
        setShowCreateModal(true);
        console.log("[openCreate] lease_id:", createForm.data.lease_id);
    }

    // Auto-populate period_start when modal opens and lease is pre-selected
    React.useEffect(() => {
        if (showCreateModal && createForm.data.lease_id) {
            onLeaseChange(createForm.data.lease_id);
        }
    }, [showCreateModal]);

    function onLeaseChange(leaseId: string) {
        console.log("[onLeaseChange] leaseId:", leaseId);
        createForm.setData("lease_id", leaseId);
        const lease = activeLeases.find((l) => l.id === Number(leaseId));
        console.log("[onLeaseChange] lease:", lease);
        if (lease) {
            // Find all invoices for this lease, sorted by period_end descending
            const leaseInvoices = invoices.data
                .filter(
                    (inv) =>
                        inv.tenant === lease.tenant && inv.unit === lease.unit,
                )
                .sort((a, b) => (a.period_end < b.period_end ? 1 : -1));
            console.log("[onLeaseChange] leaseInvoices:", leaseInvoices);

            let nextPeriodStart = "";
            if (leaseInvoices.length > 0 && leaseInvoices[0].period_end) {
                // Set to the day after the last invoice's period_end
                const lastEnd = new Date(leaseInvoices[0].period_end);
                lastEnd.setDate(lastEnd.getDate() + 1);
                nextPeriodStart = lastEnd.toISOString().split("T")[0];
            } else if (lease.fitout_applicable && lease.fitout_end_date) {
                // If fit-out applies, start after fit-out end
                const fitoutEnd = new Date(lease.fitout_end_date);
                fitoutEnd.setDate(fitoutEnd.getDate() + 1);
                nextPeriodStart = fitoutEnd.toISOString().split("T")[0];
            } else if (lease.start_date) {
                // Fallback to lease start_date
                nextPeriodStart = lease.start_date;
            } else {
                // Fallback to today if all else fails
                nextPeriodStart = new Date().toISOString().split("T")[0];
            }
            console.log("[onLeaseChange] nextPeriodStart:", nextPeriodStart);

            // Always set period_start
            createForm.setData("period_start", nextPeriodStart);
            createForm.setData(
                "billing_months",
                String(lease.billing_cycle_months || 3),
            );
        }
    }

    function addItem() {
        setAdditionalItems([
            ...additionalItems,
            { description: "", amount: "", item_type: "other" },
        ]);
    }

    function removeItem(index: number) {
        setAdditionalItems(additionalItems.filter((_, i) => i !== index));
    }

    function updateItem(
        index: number,
        field: keyof AdditionalItem,
        value: string,
    ) {
        const updated = [...additionalItems];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalItems(updated);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const items = additionalItems
            .filter((it) => it.description && Number(it.amount) > 0)
            .map((it) => ({
                description: it.description,
                amount: Number(it.amount),
                item_type: it.item_type || "other",
            }));

        createForm.transform((data) => ({
            ...data,
            additional_items: items.length > 0 ? items : undefined,
        }));

        createForm.post("/manager/invoices", {
            onSuccess: () => {
                setShowCreateModal(false);
                setAdditionalItems([]);
            },
        });
    }

    return (
        <ManagerLayout
            title="Invoices"
            activeNav="invoices"
            user={user}
            building={building}
        >
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: "Total Invoiced",
                        value: formatCurrency(stats.total_invoiced),
                        color: "blue",
                    },
                    {
                        label: "Total Paid",
                        value: formatCurrency(stats.total_paid),
                        color: "emerald",
                    },
                    {
                        label: "Outstanding",
                        value: formatCurrency(stats.outstanding),
                        color: "amber",
                    },
                    {
                        label: "Overdue",
                        value: String(stats.overdue_count),
                        color: "red",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {s.label}
                        </p>
                        <p
                            className={`mt-2 text-2xl font-bold text-${s.color}-600`}
                        >
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Header + Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
                <div className="flex items-end gap-3 flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && applyFilters()
                            }
                            placeholder="Invoice #, tenant, unit..."
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition w-56"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Type
                        </label>
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setTimeout(applyFilters, 0);
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        >
                            <option value="">All</option>
                            <option value="proforma">Proforma</option>
                            <option value="invoice">Invoice</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            Status
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                setTimeout(applyFilters, 0);
                            }}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        >
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button
                        onClick={applyFilters}
                        className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                    >
                        Search
                    </button>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Create Invoice
                </button>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Number
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Tenant / Unit
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Period
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Paid
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Balance
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-4 py-12 text-center text-sm text-slate-400"
                                    >
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                invoices.data.map((inv) => (
                                    <tr
                                        key={inv.id}
                                        className="hover:bg-slate-50/50 transition"
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/manager/invoices/${inv.id}`}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                {inv.type === "proforma"
                                                    ? inv.proforma_number
                                                    : inv.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[inv.type] || ""}`}
                                            >
                                                {inv.type === "proforma"
                                                    ? "Proforma"
                                                    : "Invoice"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-slate-800">
                                                {inv.tenant}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Unit {inv.unit}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-slate-600">
                                                {inv.period_start}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                to {inv.period_end}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                                            {formatCurrency(
                                                inv.total_amount,
                                                inv.currency,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-emerald-600">
                                            {formatCurrency(
                                                inv.amount_paid,
                                                inv.currency,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                                            {formatCurrency(
                                                inv.balance,
                                                inv.currency,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[inv.status] || "bg-slate-100 text-slate-600"}`}
                                            >
                                                {inv.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    inv.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/manager/invoices/${inv.id}`}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition inline-flex items-center"
                                                title="View"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {invoices.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {invoices.links.map((link, i) => (
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

            {/* ============================================================ */}
            {/* Create Invoice / Proforma Modal                               */}
            {/* ============================================================ */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">
                            Create{" "}
                            {createForm.data.type === "proforma"
                                ? "Proforma"
                                : "Invoice"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Type selector */}
                            <div className="flex gap-3">
                                {(
                                    [
                                        ["invoice", "Invoice"],
                                        ["proforma", "Proforma"],
                                    ] as const
                                ).map(([val, label]) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() =>
                                            createForm.setData("type", val)
                                        }
                                        className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition border ${
                                            createForm.data.type === val
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Lease selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Lease (Tenant — Unit)
                                </label>
                                <select
                                    value={createForm.data.lease_id}
                                    onChange={(e) =>
                                        onLeaseChange(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select a lease...</option>
                                    {activeLeases.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.tenant} — Unit {l.unit} (
                                            {formatCurrency(
                                                l.monthly_rent,
                                                l.rent_currency,
                                            )}
                                            /mo)
                                        </option>
                                    ))}
                                </select>
                                {createForm.errors.lease_id && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {createForm.errors.lease_id}
                                    </p>
                                )}
                            </div>

                            {/* Billing months + dates row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Billing Period
                                    </label>
                                    <select
                                        value={createForm.data.billing_months}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "billing_months",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="3">3 Months</option>
                                        <option value="4">4 Months</option>
                                        <option value="6">6 Months</option>
                                        <option value="12">12 Months</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Period Start
                                    </label>
                                    <input
                                        type="date"
                                        value={createForm.data.period_start}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "period_start",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Issue Date
                                    </label>
                                    <input
                                        type="date"
                                        value={createForm.data.issue_date}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "issue_date",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={createForm.data.due_date}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "due_date",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Tax rates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Service Charge %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={
                                            createForm.data.service_charge_rate
                                        }
                                        onChange={(e) =>
                                            createForm.setData(
                                                "service_charge_rate",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Withholding Tax %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={
                                            createForm.data.withholding_tax_rate
                                        }
                                        onChange={(e) =>
                                            createForm.setData(
                                                "withholding_tax_rate",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Additional items */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Additional Charges
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        + Add Item
                                    </button>
                                </div>
                                {additionalItems.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-2 mb-2 items-start"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) =>
                                                updateItem(
                                                    i,
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                        <select
                                            value={item.item_type}
                                            onChange={(e) =>
                                                updateItem(
                                                    i,
                                                    "item_type",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-28 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                                        >
                                            <option value="deposit">
                                                Deposit
                                            </option>
                                            <option value="penalty">
                                                Penalty
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Amount"
                                            value={item.amount}
                                            onChange={(e) =>
                                                updateItem(
                                                    i,
                                                    "amount",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeItem(i)}
                                            className="p-2 text-red-400 hover:text-red-600"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            {selectedLease && (
                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                                        Amount Summary
                                    </h4>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">
                                            Rent ({billingMonths} mo ×{" "}
                                            {formatCurrency(
                                                monthlyRent,
                                                selectedLease.rent_currency,
                                            )}
                                            )
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            {formatCurrency(
                                                rentAmount,
                                                selectedLease.rent_currency,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">
                                            Service Charge ({serviceChargeRate}
                                            %)
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            {formatCurrency(
                                                serviceChargeAmount,
                                                selectedLease.rent_currency,
                                            )}
                                        </span>
                                    </div>
                                    {additionalTotal > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">
                                                Additional Charges
                                            </span>
                                            <span className="font-medium text-slate-700">
                                                {formatCurrency(
                                                    additionalTotal,
                                                    selectedLease.rent_currency,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                                        <span className="text-slate-600 font-medium">
                                            Subtotal
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {formatCurrency(
                                                subtotal,
                                                selectedLease.rent_currency,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>
                                            Withholding Tax (
                                            {withholdingTaxRate}%)
                                        </span>
                                        <span className="font-medium">
                                            −
                                            {formatCurrency(
                                                withholdingTaxAmount,
                                                selectedLease.rent_currency,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-slate-300 pt-2">
                                        <span className="text-slate-800 font-bold">
                                            Net Payable
                                        </span>
                                        <span className="font-bold text-blue-700 text-base">
                                            {formatCurrency(
                                                totalAmount,
                                                selectedLease.rent_currency,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={createForm.data.notes}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "notes",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="Optional notes..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50"
                                >
                                    {createForm.processing
                                        ? "Creating..."
                                        : `Create ${createForm.data.type === "proforma" ? "Proforma" : "Invoice"}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
