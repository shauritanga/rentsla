import React, { useState } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm, Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Ziggy } from "@/ziggy";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    item_type: string;
}

interface InvoicePayment {
    id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference: string | null;
    received_by: string;
}

interface InvoiceDetail {
    id: number;
    invoice_number: string;
    proforma_number: string | null;
    type: "proforma" | "invoice";
    status: string;
    billing_months: number;
    issue_date: string;
    due_date: string;
    period_start: string;
    period_end: string;
    rent_amount: number;
    service_charge_rate: number;
    service_charge_amount: number;
    subtotal: number;
    withholding_tax_rate: number;
    withholding_tax_amount: number;
    total_amount: number;
    amount_paid: number;
    balance: number;
    currency: string;
    notes: string | null;
    converted_at: string | null;
    created_by: string;
    created_at: string;
    tenant: {
        full_name: string;
        email: string | null;
        phone: string | null;
        tin_number: string | null;
        billing_address: string | null;
    };
    unit: {
        unit_number: string | null;
        area_sqm: number | null;
    };
    lease_id: number;
    items: InvoiceItem[];
    payments: InvoicePayment[];
}

interface Props {
    user: { name: string; email: string; role?: string };
    building: { id: number; name: string; address: string };
    invoice: InvoiceDetail;
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

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-TZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    overdue: "bg-red-50 text-red-700",
    cancelled: "bg-slate-100 text-slate-400",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function InvoiceShow({ user, building, invoice }: Props) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const paymentForm = useForm({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        reference: "",
        notes: "",
    });

    function handleConvert() {
        if (
            confirm(
                "Convert this proforma to a formal invoice? This cannot be undone.",
            )
        ) {
            router.post(`/manager/invoices/${invoice.id}/convert`);
        }
    }

    function handleSend() {
        router.post(`/manager/invoices/${invoice.id}/send`);
    }

    function handleCancel() {
        if (confirm("Cancel this invoice? This cannot be undone.")) {
            router.post(`/manager/invoices/${invoice.id}/cancel`);
        }
    }

    function handlePayment(e: React.FormEvent) {
        e.preventDefault();
        paymentForm.post(`/manager/invoices/${invoice.id}/payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                paymentForm.reset();
            },
        });
    }

    const displayNumber =
        invoice.type === "proforma"
            ? invoice.proforma_number
            : invoice.invoice_number;

    const canRecordPayment =
        invoice.type === "invoice" &&
        !["paid", "cancelled"].includes(invoice.status);
    const canConvert = invoice.type === "proforma";
    const canSend =
        invoice.type === "invoice" &&
        ["draft", "sent", "partial", "overdue"].includes(invoice.status);
    const canCancel = !["paid", "cancelled"].includes(invoice.status);

    return (
        <ManagerLayout
            title={`${invoice.type === "proforma" ? "Proforma" : "Invoice"} ${displayNumber}`}
            activeNav="invoices"
            user={user}
            building={building}
        >
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm">
                    <Link
                        href="/manager/invoices"
                        className="text-slate-500 hover:text-blue-600 transition"
                    >
                        Invoices
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="font-medium text-slate-800">
                        {displayNumber}
                    </span>
                    <span
                        className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[invoice.status] || "bg-slate-100 text-slate-600"}`}
                    >
                        {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                    </span>
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${invoice.type === "proforma" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}
                    >
                        {invoice.type === "proforma" ? "Proforma" : "Invoice"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={route(
                            "manager.invoices.download",
                            { invoice: invoice.id },
                            false,
                            Ziggy,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition border border-slate-200"
                    >
                        Download PDF
                    </a>
                    {canConvert && (
                        <button
                            onClick={handleConvert}
                            className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
                        >
                            Convert to Invoice
                        </button>
                    )}
                    {canSend && (
                        <button
                            onClick={handleSend}
                            className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                        >
                            {invoice.status === "draft"
                                ? "Send to Tenant"
                                : "Resend to Tenant"}
                        </button>
                    )}
                    {canRecordPayment && (
                        <button
                            onClick={() => {
                                paymentForm.setData(
                                    "amount",
                                    String(invoice.balance),
                                );
                                setShowPaymentModal(true);
                            }}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40"
                        >
                            Record Payment
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={handleCancel}
                            className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — Invoice details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice header card */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {invoice.type === "proforma"
                                        ? "PROFORMA INVOICE"
                                        : "INVOICE"}
                                </h2>
                                <p className="text-lg font-semibold text-blue-600 mt-1">
                                    {displayNumber}
                                </p>
                                {invoice.converted_at && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        Converted from {invoice.proforma_number}{" "}
                                        on {formatDate(invoice.converted_at)}
                                    </p>
                                )}
                            </div>
                            <div className="text-right text-sm text-slate-500">
                                <p>
                                    Issue:{" "}
                                    <span className="font-medium text-slate-700">
                                        {formatDate(invoice.issue_date)}
                                    </span>
                                </p>
                                <p>
                                    Due:{" "}
                                    <span className="font-medium text-slate-700">
                                        {formatDate(invoice.due_date)}
                                    </span>
                                </p>
                                <p className="mt-1">
                                    Period:{" "}
                                    <span className="font-medium text-slate-700">
                                        {formatDate(invoice.period_start)} —{" "}
                                        {formatDate(invoice.period_end)}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Bill to */}
                        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-100">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                    Bill To
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {invoice.tenant.full_name}
                                </p>
                                {invoice.tenant.tin_number && (
                                    <p className="text-sm text-slate-500">
                                        TIN: {invoice.tenant.tin_number}
                                    </p>
                                )}
                                {invoice.tenant.email && (
                                    <p className="text-sm text-slate-500">
                                        {invoice.tenant.email}
                                    </p>
                                )}
                                {invoice.tenant.phone && (
                                    <p className="text-sm text-slate-500">
                                        {invoice.tenant.phone}
                                    </p>
                                )}
                                {invoice.tenant.billing_address && (
                                    <p className="text-sm text-slate-500 whitespace-pre-line mt-1">
                                        {invoice.tenant.billing_address}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                    Property
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {building.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                    Unit {invoice.unit.unit_number}
                                    {invoice.unit.area_sqm &&
                                        ` (${invoice.unit.area_sqm} sqm)`}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {building.address}
                                </p>
                            </div>
                        </div>

                        {/* Line items table */}
                        <table className="w-full mb-6">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-2 text-left text-xs font-semibold uppercase text-slate-500">
                                        Description
                                    </th>
                                    <th className="py-2 text-right text-xs font-semibold uppercase text-slate-500">
                                        Qty
                                    </th>
                                    <th className="py-2 text-right text-xs font-semibold uppercase text-slate-500">
                                        Rate
                                    </th>
                                    <th className="py-2 text-right text-xs font-semibold uppercase text-slate-500">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 text-sm text-slate-700">
                                            {item.description}
                                        </td>
                                        <td className="py-3 text-right text-sm text-slate-600">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 text-right text-sm text-slate-600">
                                            {formatCurrency(
                                                item.unit_price,
                                                invoice.currency,
                                            )}
                                        </td>
                                        <td className="py-3 text-right text-sm font-medium text-slate-800">
                                            {formatCurrency(
                                                item.amount,
                                                invoice.currency,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="ml-auto max-w-xs space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">
                                    Rent Amount
                                </span>
                                <span className="font-medium text-slate-700">
                                    {formatCurrency(
                                        invoice.rent_amount,
                                        invoice.currency,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">
                                    Service Charge (
                                    {invoice.service_charge_rate}%)
                                </span>
                                <span className="font-medium text-slate-700">
                                    {formatCurrency(
                                        invoice.service_charge_amount,
                                        invoice.currency,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                                <span className="font-medium text-slate-600">
                                    Subtotal
                                </span>
                                <span className="font-semibold text-slate-800">
                                    {formatCurrency(
                                        invoice.subtotal,
                                        invoice.currency,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-red-600">
                                <span>
                                    Withholding Tax (
                                    {invoice.withholding_tax_rate}%)
                                </span>
                                <span className="font-medium">
                                    −
                                    {formatCurrency(
                                        invoice.withholding_tax_amount,
                                        invoice.currency,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-slate-300 pt-2">
                                <span className="font-bold text-slate-800">
                                    Total Payable
                                </span>
                                <span className="font-bold text-blue-700 text-lg">
                                    {formatCurrency(
                                        invoice.total_amount,
                                        invoice.currency,
                                    )}
                                </span>
                            </div>
                            {invoice.amount_paid > 0 && (
                                <>
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span>Amount Paid</span>
                                        <span className="font-medium">
                                            −
                                            {formatCurrency(
                                                invoice.amount_paid,
                                                invoice.currency,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-slate-300 pt-2">
                                        <span className="font-bold text-slate-800">
                                            Balance Due
                                        </span>
                                        <span
                                            className={`font-bold text-lg ${invoice.balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                                        >
                                            {formatCurrency(
                                                invoice.balance,
                                                invoice.currency,
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
                                    Notes
                                </p>
                                <p className="text-sm text-slate-600 whitespace-pre-line">
                                    {invoice.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column — Payments & meta */}
                <div className="space-y-6">
                    {/* Payment summary card */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">
                            Payment Summary
                        </h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-sm text-slate-500">
                                    Total
                                </dt>
                                <dd className="text-sm font-medium text-slate-800">
                                    {formatCurrency(
                                        invoice.total_amount,
                                        invoice.currency,
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-slate-500">Paid</dt>
                                <dd className="text-sm font-medium text-emerald-600">
                                    {formatCurrency(
                                        invoice.amount_paid,
                                        invoice.currency,
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2">
                                <dt className="text-sm font-medium text-slate-700">
                                    Balance
                                </dt>
                                <dd
                                    className={`text-sm font-bold ${invoice.balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                                >
                                    {formatCurrency(
                                        invoice.balance,
                                        invoice.currency,
                                    )}
                                </dd>
                            </div>
                        </dl>

                        {/* Payment progress bar */}
                        <div className="mt-4">
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{
                                        width: `${Math.min(100, invoice.total_amount > 0 ? (invoice.amount_paid / invoice.total_amount) * 100 : 0)}%`,
                                    }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1 text-right">
                                {invoice.total_amount > 0
                                    ? Math.round(
                                          (invoice.amount_paid /
                                              invoice.total_amount) *
                                              100,
                                      )
                                    : 0}
                                % paid
                            </p>
                        </div>
                    </div>

                    {/* Payment history */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">
                            Payment History
                        </h3>
                        {invoice.payments.length === 0 ? (
                            <p className="text-sm text-slate-400">
                                No payments recorded yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {invoice.payments.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex-shrink-0">
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800">
                                                {formatCurrency(
                                                    p.amount,
                                                    invoice.currency,
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {p.payment_date} ·{" "}
                                                {p.payment_method.replace(
                                                    "_",
                                                    " ",
                                                )}
                                            </p>
                                            {p.reference && (
                                                <p className="text-xs text-slate-400">
                                                    Ref: {p.reference}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-400">
                                                By {p.received_by}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">
                            Details
                        </h3>
                        <dl className="space-y-2">
                            <div className="flex justify-between">
                                <dt className="text-sm text-slate-500">
                                    Created by
                                </dt>
                                <dd className="text-sm text-slate-700">
                                    {invoice.created_by}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-slate-500">
                                    Created at
                                </dt>
                                <dd className="text-sm text-slate-700">
                                    {invoice.created_at}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-slate-500">
                                    Lease
                                </dt>
                                <dd className="text-sm">
                                    <Link
                                        href={`/manager/leases/${invoice.lease_id}`}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        View Lease
                                    </Link>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* Record Payment Modal                                          */}
            {/* ============================================================ */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowPaymentModal(false)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">
                            Record Payment
                        </h2>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={paymentForm.data.amount}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "amount",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {paymentForm.errors.amount && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {paymentForm.errors.amount}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-slate-400">
                                    Balance:{" "}
                                    {formatCurrency(
                                        invoice.balance,
                                        invoice.currency,
                                    )}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    value={paymentForm.data.payment_date}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "payment_date",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentForm.data.payment_method}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "payment_method",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    <option value="bank_transfer">
                                        Bank Transfer
                                    </option>
                                    <option value="cash">Cash</option>
                                    <option value="mobile_money">
                                        Mobile Money
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Reference
                                </label>
                                <input
                                    type="text"
                                    value={paymentForm.data.reference}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "reference",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Transaction reference..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={paymentForm.data.notes}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            "notes",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 disabled:opacity-50"
                                >
                                    {paymentForm.processing
                                        ? "Recording..."
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
