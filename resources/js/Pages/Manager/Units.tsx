import React, { useState, useEffect } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm, usePage } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FloorOption {
    id: number;
    name: string;
    sequence: number;
}

interface Unit {
    id: number;
    unit_number: string;
    area_sqm: number | null;
    unit_type: string;
    rent_amount: number | null;
    rent_currency: string;
    status: string;
    floor: { id: number; name: string } | null;
    tenant: { id: number; name: string } | null;
    monthly_rent: number | null;
}

interface PaginatedUnits {
    data: Unit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    units: PaginatedUnits;
    floors: FloorOption[];
    filters: { search: string; floor_id: string; status: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const UNIT_TYPES = [
    { value: "office", label: "Office" },
    { value: "store", label: "Store" },
    { value: "parking", label: "Parking" },
    { value: "warehouse", label: "Warehouse" },
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "workshop", label: "Workshop" },
    { value: "restaurant", label: "Restaurant" },
    { value: "clinic", label: "Clinic" },
    { value: "other", label: "Other" },
];

const CURRENCIES = [
    { value: "TZS", label: "TZS (Tanzanian Shilling)" },
    { value: "USD", label: "USD (US Dollar)" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatCurrency(amount: number, currency: string = "TZS") {
    return new Intl.NumberFormat(currency === "TZS" ? "en-TZ" : "en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        vacant: "bg-amber-50 text-amber-700",
        occupied: "bg-emerald-50 text-emerald-700",
        maintenance: "bg-slate-100 text-slate-600",
    };
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                map[status] || "bg-slate-100 text-slate-600"
            }`}
        >
            {status}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Units({
    user,
    building,
    units,
    floors,
    filters,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    const { props } = usePage<{
        flash: { success?: string; error?: string };
    }>();

    useEffect(() => {
        if (props.flash?.success) {
            setToast({ message: props.flash.success, type: "success" });
        } else if (props.flash?.error) {
            setToast({ message: props.flash.error, type: "error" });
        }
    }, [props.flash?.success, props.flash?.error]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const [search, setSearch] = useState(filters.search);
    const [floorFilter, setFloorFilter] = useState(filters.floor_id);
    const [statusFilter, setStatusFilter] = useState(filters.status);

    const form = useForm({
        unit_number: "",
        floor_id: "",
        area_sqm: "",
        unit_type: "office",
        rent_amount: "",
        rent_currency: "TZS",
    });

    function applyFilters() {
        router.get(
            "/manager/units",
            {
                search: search || undefined,
                floor_id: floorFilter || undefined,
                status: statusFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function clearFilters() {
        setSearch("");
        setFloorFilter("");
        setStatusFilter("");
        router.get(
            "/manager/units",
            {},
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        setEditingUnit(null);
        form.setData({
            unit_number: "",
            floor_id: floors[0]?.id?.toString() || "",
            area_sqm: "",
            unit_type: "office",
            rent_amount: "",
            rent_currency: "TZS",
        });
        form.clearErrors();
        setShowModal(true);
    }

    function openEdit(unit: Unit) {
        setEditingUnit(unit);
        form.setData({
            unit_number: unit.unit_number,
            floor_id: unit.floor?.id?.toString() || "",
            area_sqm: unit.area_sqm?.toString() || "",
            unit_type: unit.unit_type || "office",
            rent_amount: unit.rent_amount?.toString() || "",
            rent_currency: unit.rent_currency || "TZS",
        });
        form.clearErrors();
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingUnit(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingUnit) {
            form.put(`/manager/units/${editingUnit.id}`, {
                onSuccess: () => {
                    closeModal();
                    setToast({
                        message: "Unit updated successfully.",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        message:
                            "Failed to update unit. Check the form for errors.",
                        type: "error",
                    });
                },
            });
        } else {
            form.post("/manager/units", {
                onSuccess: () => {
                    closeModal();
                    setToast({
                        message: "Unit created successfully.",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        message:
                            "Failed to create unit. Check the form for errors.",
                        type: "error",
                    });
                },
            });
        }
    }

    function openDelete(unit: Unit) {
        setDeletingUnit(unit);
        setDeleteConfirmText("");
        setDeleteError("");
        setShowDeleteModal(true);
    }

    function handleDelete() {
        if (!deletingUnit) return;
        setIsDeleting(true);
        setDeleteError("");
        router.delete(`/manager/units/${deletingUnit.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingUnit(null);
                setIsDeleting(false);
                setToast({
                    message: "Unit deleted successfully.",
                    type: "success",
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const msg =
                    (errors as Record<string, string>).unit ||
                    "Failed to delete unit.";
                setDeleteError(msg);
            },
        });
    }

    return (
        <ManagerLayout
            title="Units"
            activeNav="units"
            user={user}
            building={building}
        >
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-top-2">
                    <div
                        className={`flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg text-sm font-medium ${
                            toast.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                    >
                        {toast.type === "success" ? (
                            <svg
                                className="h-5 w-5 text-emerald-500 shrink-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="h-5 w-5 text-red-500 shrink-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        <span>{toast.message}</span>
                        <button
                            onClick={() => setToast(null)}
                            className="ml-2 text-current opacity-50 hover:opacity-100 transition"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Units</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {units.total} units in {building.name}
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
                    Add Unit
                </button>
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
                        placeholder="Unit number..."
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition w-40"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Floor
                    </label>
                    <select
                        value={floorFilter}
                        onChange={(e) => setFloorFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    >
                        <option value="">All Floors</option>
                        {floors.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Status
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    >
                        <option value="">All</option>
                        <option value="occupied">Occupied</option>
                        <option value="vacant">Vacant</option>
                    </select>
                </div>
                <button
                    onClick={applyFilters}
                    className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                    Filter
                </button>
                {(filters.search || filters.floor_id || filters.status) && (
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
                                Unit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Floor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Type
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Area (m²)
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Tenant
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Unit Rent
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {units.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-6 py-12 text-center text-sm text-slate-400"
                                >
                                    No units found.
                                </td>
                            </tr>
                        ) : (
                            units.data.map((unit) => (
                                <tr
                                    key={unit.id}
                                    className="hover:bg-slate-50/50 transition"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-slate-800">
                                            {unit.unit_number}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {unit.floor?.name || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                                        {unit.unit_type || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-600">
                                        {unit.area_sqm
                                            ? `${Number(unit.area_sqm).toLocaleString()} m²`
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {statusBadge(unit.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {unit.tenant?.name || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-800">
                                        {unit.rent_amount
                                            ? formatCurrency(
                                                  Number(unit.rent_amount),
                                                  unit.rent_currency,
                                              )
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(unit)}
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
                                            <button
                                                onClick={() => openDelete(unit)}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                                title="Delete"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.005 11.36A2.75 2.75 0 007.77 20h4.46a2.75 2.75 0 002.751-2.689l1.005-11.36.149.022a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.5 6a.75.75 0 01-1.497-.124l.5-6a.75.75 0 01.797-.672zm3.54.697a.75.75 0 00-1.497.124l.5 6a.75.75 0 101.497-.124l-.5-6z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {units.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {units.links.map((link, i) => (
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
                            {editingUnit ? "Edit Unit" : "Add Unit"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Unit Number
                                </label>
                                <input
                                    type="text"
                                    value={form.data.unit_number}
                                    onChange={(e) =>
                                        form.setData(
                                            "unit_number",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g., A101"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.unit_number && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.unit_number}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Floor
                                </label>
                                <select
                                    value={form.data.floor_id}
                                    onChange={(e) =>
                                        form.setData("floor_id", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    <option value="">Select floor</option>
                                    {floors.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.floor_id && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.floor_id}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Unit Type
                                </label>
                                <select
                                    value={form.data.unit_type}
                                    onChange={(e) =>
                                        form.setData(
                                            "unit_type",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    {UNIT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.unit_type && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.unit_type}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Area (m²)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.area_sqm}
                                    onChange={(e) =>
                                        form.setData("area_sqm", e.target.value)
                                    }
                                    placeholder="e.g., 45.50"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.area_sqm && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.area_sqm}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Rent Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.data.rent_amount}
                                        onChange={(e) =>
                                            form.setData(
                                                "rent_amount",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g., 500000"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    />
                                    {form.errors.rent_amount && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {form.errors.rent_amount}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Currency
                                    </label>
                                    <select
                                        value={form.data.rent_currency}
                                        onChange={(e) =>
                                            form.setData(
                                                "rent_currency",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option
                                                key={c.value}
                                                value={c.value}
                                            >
                                                {c.value}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.rent_currency && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {form.errors.rent_currency}
                                        </p>
                                    )}
                                </div>
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
                                        : editingUnit
                                          ? "Update"
                                          : "Add Unit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    />
                    <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                            <svg
                                className="h-6 w-6 text-red-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Delete Unit
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Are you sure you want to delete unit{" "}
                            <span className="font-semibold text-slate-700">
                                {deletingUnit.unit_number}
                            </span>
                            ? This action is permanent and cannot be undone.
                        </p>
                        {deleteError && (
                            <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                {deleteError}
                            </div>
                        )}
                        <div className="mt-4 text-left">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                Type{" "}
                                <span className="font-bold text-slate-700">
                                    {deletingUnit.unit_number}
                                </span>{" "}
                                to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) =>
                                    setDeleteConfirmText(e.target.value)
                                }
                                placeholder={deletingUnit.unit_number}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition"
                                autoFocus
                            />
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={
                                    isDeleting ||
                                    deleteConfirmText.toLowerCase() !==
                                        deletingUnit.unit_number.toLowerCase()
                                }
                                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
