import React, { useState } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ActiveLease {
    id: number;
    unit: string | null;
    monthly_rent: number;
    start_date: string;
}

interface Tenant {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
    tin_number: string | null;
    billing_address: string | null;
    active_lease: ActiveLease | null;
    created_at: string;
}

interface PaginatedTenants {
    data: Tenant[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    tenants: PaginatedTenants;
    filters: { search: string };
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
export default function Tenants({ user, building, tenants, filters }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [search, setSearch] = useState(filters.search);

    const form = useForm({
        full_name: "",
        email: "",
        phone: "",
        tin_number: "",
        billing_address: "",
    });

    function applySearch() {
        router.get(
            "/manager/tenants",
            { search: search || undefined },
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        setEditingTenant(null);
        form.setData({ full_name: "", email: "", phone: "", tin_number: "", billing_address: "" });
        form.clearErrors();
        setShowModal(true);
    }

    function openEdit(tenant: Tenant) {
        setEditingTenant(tenant);
        form.setData({
            full_name: tenant.full_name,
            email: tenant.email || "",
            phone: tenant.phone || "",
            tin_number: tenant.tin_number || "",
            billing_address: tenant.billing_address || "",
        });
        form.clearErrors();
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingTenant(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingTenant) {
            form.put(`/manager/tenants/${editingTenant.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            form.post("/manager/tenants", {
                onSuccess: () => closeModal(),
            });
        }
    }

    return (
        <ManagerLayout
            title="Tenants"
            activeNav="tenants"
            user={user}
            building={building}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Tenants
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {tenants.total} tenants linked to {building.name}
                    </p>
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
                    Add Tenant
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 flex items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Search
                    </label>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applySearch()}
                        placeholder="Name, email, phone..."
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition w-64"
                    />
                </div>
                <button
                    onClick={applySearch}
                    className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                    Search
                </button>
                {filters.search && (
                    <button
                        onClick={() => {
                            setSearch("");
                            router.get(
                                "/manager/tenants",
                                {},
                                { preserveState: true, replace: true },
                            );
                        }}
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
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Unit
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Rent
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tenants.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-12 text-center text-sm text-slate-400"
                                >
                                    No tenants found.
                                </td>
                            </tr>
                        ) : (
                            tenants.data.map((tenant) => (
                                <tr
                                    key={tenant.id}
                                    className="hover:bg-slate-50/50 transition"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white">
                                                {tenant.full_name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800">
                                                {tenant.full_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600">
                                            {tenant.email || "—"}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {tenant.phone || "—"}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {tenant.active_lease?.unit || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-800">
                                        {tenant.active_lease
                                            ? formatCurrency(
                                                  tenant.active_lease
                                                      .monthly_rent,
                                              )
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {tenant.active_lease ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                No Lease
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openEdit(tenant)}
                                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                                            title="Edit"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {tenants.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {tenants.links.map((link, i) => (
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">
                            {editingTenant ? "Edit Tenant" : "Add Tenant"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={form.data.full_name}
                                    onChange={(e) =>
                                        form.setData(
                                            "full_name",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="John Doe"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.full_name && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.full_name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData("email", e.target.value)
                                    }
                                    placeholder="john@example.com"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.email && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData("phone", e.target.value)
                                    }
                                    placeholder="+255 XXX XXX XXX"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.phone && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.phone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    TIN Number
                                </label>
                                <input
                                    type="text"
                                    value={form.data.tin_number}
                                    onChange={(e) =>
                                        form.setData(
                                            "tin_number",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="TIN-XXX-XXX-XXX"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.tin_number && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.tin_number}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Billing Address
                                </label>
                                <textarea
                                    value={form.data.billing_address}
                                    onChange={(e) =>
                                        form.setData(
                                            "billing_address",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="P.O. Box 1234, Dar es Salaam"
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                />
                                {form.errors.billing_address && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.billing_address}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
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
                                        : editingTenant
                                          ? "Update"
                                          : "Add Tenant"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
