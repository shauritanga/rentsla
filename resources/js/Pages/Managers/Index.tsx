import React, { useState, useRef, useEffect } from "react";
import { router, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ManagerBuilding {
    id: number;
    name: string;
    address: string | null;
}

interface Manager {
    id: number;
    name: string;
    email: string;
    building: ManagerBuilding | null;
    created_at: string;
}

interface PaginatedManagers {
    data: Manager[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface ManagersPageProps {
    managers: PaginatedManagers;
    availableBuildings: ManagerBuilding[];
    stats: { total: number; assigned: number; unassigned: number };
    filters: { search: string };
    user: { name: string; email: string };
}

/* ------------------------------------------------------------------ */
/*  Create / Edit Modal                                                */
/* ------------------------------------------------------------------ */
function ManagerModal({
    open,
    onClose,
    manager,
    buildings,
}: {
    open: boolean;
    onClose: () => void;
    manager: Manager | null;
    buildings: ManagerBuilding[];
}) {
    const isEdit = !!manager;

    const { data, setData, post, put, processing, errors, reset, transform } =
        useForm({
            name: manager?.name ?? "",
            email: manager?.email ?? "",
            password: "",
            building_id: manager?.building?.id?.toString() ?? "",
        });

    React.useEffect(() => {
        if (open) {
            setData({
                name: manager?.name ?? "",
                email: manager?.email ?? "",
                password: "",
                building_id: manager?.building?.id?.toString() ?? "",
            });
        }
    }, [open, manager]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            building_id: data.building_id || null,
            password: data.password || undefined,
        }));
        if (isEdit) {
            put(`/managers/${manager!.id}`, {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post("/managers", {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                        {isEdit ? "Edit Manager" : "Invite New Manager"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                            placeholder="e.g. John Doe"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Email Address{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                            placeholder="e.g. john@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Password{" "}
                            {!isEdit ? (
                                <span className="text-red-500">*</span>
                            ) : (
                                <span className="text-slate-400 text-xs font-normal">
                                    (leave blank to keep current)
                                </span>
                            )}
                        </label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                            placeholder={
                                isEdit
                                    ? "Enter new password"
                                    : "Min. 8 characters"
                            }
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Assign Building */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Assign Building{" "}
                            <span className="text-slate-400 text-xs font-normal">
                                (optional)
                            </span>
                        </label>
                        <select
                            value={data.building_id}
                            onChange={(e) =>
                                setData("building_id", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        >
                            <option value="">None (assign later)</option>
                            {buildings.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                    {b.address ? ` — ${b.address}` : ""}
                                </option>
                            ))}
                            {/* When editing, also show current building */}
                            {isEdit &&
                                manager?.building &&
                                !buildings.find(
                                    (b) => b.id === manager.building!.id,
                                ) && (
                                    <option value={manager.building.id}>
                                        {manager.building.name}
                                        {manager.building.address
                                            ? ` — ${manager.building.address}`
                                            : ""}
                                    </option>
                                )}
                        </select>
                        {errors.building_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.building_id}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition"
                        >
                            {processing
                                ? "Saving..."
                                : isEdit
                                  ? "Update Manager"
                                  : "Create Manager"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirm Modal                                               */
/* ------------------------------------------------------------------ */
function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    managerName,
    processing,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    managerName: string;
    processing: boolean;
}) {
    const [confirmText, setConfirmText] = useState("");
    const nameMatches =
        confirmText.trim().toLowerCase() === managerName.trim().toLowerCase();

    // Reset input when modal opens/closes
    useEffect(() => {
        if (!open) setConfirmText("");
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
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
                    Remove Manager
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                    Are you sure you want to remove{" "}
                    <span className="font-semibold text-slate-700">
                        {managerName}
                    </span>
                    ? This will unassign them from any building and archive
                    their account.
                </p>
                <div className="mt-4 text-left">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Type{" "}
                        <span className="font-bold text-slate-700">
                            {managerName}
                        </span>{" "}
                        to confirm
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={managerName}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing || !nameMatches}
                        className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {processing ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Summary Card                                                       */
/* ------------------------------------------------------------------ */
function SummaryCard({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                        {label}
                    </p>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ${accent} group-hover:bg-emerald-50 group-hover:text-emerald-500 transition`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Managers Page                                                 */
/* ------------------------------------------------------------------ */
export default function ManagersIndex({
    managers,
    availableBuildings,
    stats,
    filters,
    user,
}: ManagersPageProps) {
    const [search, setSearch] = useState(filters.search);
    const [modalOpen, setModalOpen] = useState(false);
    const [editManager, setEditManager] = useState<Manager | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);
    const [deleting, setDeleting] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = (value: string) => {
        setSearch(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(
                "/managers",
                { search: value || undefined },
                { preserveState: true, replace: true },
            );
        }, 300);
    };

    const handleEdit = (manager: Manager) => {
        setEditManager(manager);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditManager(null);
        setModalOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/managers/${deleteTarget.id}`, {
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    // Merge available buildings with current manager's building for edit
    const allBuildings = editManager?.building
        ? [
              ...availableBuildings.filter(
                  (b) => b.id !== editManager.building!.id,
              ),
              editManager.building,
          ]
        : availableBuildings;

    return (
        <AppLayout title="Managers" activeNav="managers" user={user}>
            {/* Breadcrumb + Actions */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
                    <span className="text-slate-600 font-medium">Managers</span>
                </nav>

                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 transition"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Invite Manager
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
                <SummaryCard
                    label="Total Managers"
                    value={stats.total.toString()}
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                        </svg>
                    }
                    accent="text-emerald-600"
                />
                <SummaryCard
                    label="Assigned to Building"
                    value={stats.assigned.toString()}
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                    }
                    accent="text-blue-600"
                />
                <SummaryCard
                    label="Unassigned"
                    value={stats.unassigned.toString()}
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                    }
                    accent="text-amber-600"
                />
            </div>

            {/* Search + Table */}
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                {/* Search bar */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                    <div className="relative flex-1 max-w-md">
                        <svg
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        />
                    </div>
                    <p className="text-xs text-slate-400">
                        {managers.total} manager
                        {managers.total !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Manager
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Assigned Building
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 text-center">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {managers.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                            <svg
                                                className="h-8 w-8"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                                            </svg>
                                        </div>
                                        <p className="mt-4 text-sm font-semibold text-slate-600">
                                            No managers found
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {filters.search
                                                ? "Try adjusting your search"
                                                : "Invite your first manager to get started"}
                                        </p>
                                        {!filters.search && (
                                            <button
                                                onClick={handleCreate}
                                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                                                </svg>
                                                Invite Manager
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                managers.data.map((mgr) => (
                                    <tr
                                        key={mgr.id}
                                        className="group transition hover:bg-slate-50/50"
                                    >
                                        {/* Name + Avatar */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xs font-bold text-white">
                                                    {mgr.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {mgr.name}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">
                                                {mgr.email}
                                            </span>
                                        </td>

                                        {/* Building */}
                                        <td className="px-6 py-4">
                                            {mgr.building ? (
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {mgr.building.name}
                                                    </p>
                                                    {mgr.building.address && (
                                                        <p className="mt-0.5 text-xs text-slate-400 truncate max-w-[180px]">
                                                            {
                                                                mgr.building
                                                                    .address
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    Not assigned
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                                    mgr.building
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                        : "bg-slate-50 text-slate-500 ring-slate-300/40"
                                                }`}
                                            >
                                                {mgr.building
                                                    ? "Active"
                                                    : "Unassigned"}
                                            </span>
                                        </td>

                                        {/* Joined */}
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-500">
                                                {mgr.created_at}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(mgr)
                                                    }
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
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
                                                    onClick={() =>
                                                        setDeleteTarget(mgr)
                                                    }
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                                    title="Remove"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.69.81l-.49 6a.75.75 0 11-1.49-.122l.49-6a.75.75 0 01.81-.69zm2.84 0a.75.75 0 01.81.69l.49 6a.75.75 0 11-1.49.122l-.49-6a.75.75 0 01.69-.81z"
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
                {managers.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                        <p className="text-xs text-slate-400">
                            Page {managers.current_page} of {managers.last_page}{" "}
                            · {managers.total} total
                        </p>
                        <div className="flex items-center gap-1">
                            {managers.links.map((link, i) => {
                                if (!link.url) return null;

                                const isPrev = link.label.includes("Previous");
                                const isNext = link.label.includes("Next");

                                return (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            router.get(
                                                link.url!,
                                                {},
                                                { preserveState: true },
                                            )
                                        }
                                        className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                                            link.active
                                                ? "bg-emerald-500 text-white shadow-sm"
                                                : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {isPrev ? (
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        ) : isNext ? (
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        ) : (
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ManagerModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditManager(null);
                }}
                manager={editManager}
                buildings={allBuildings}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                managerName={deleteTarget?.name ?? ""}
                processing={deleting}
            />
        </AppLayout>
    );
}
