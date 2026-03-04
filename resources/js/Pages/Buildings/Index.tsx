import React, { useState, useRef, useEffect } from "react";
import { router, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Manager {
    id: number;
    name: string;
    email: string;
}

interface Building {
    id: number;
    name: string;
    address: string | null;
    manager: Manager | null;
    floors_count: number;
    units_count: number;
    occupied_units: number;
    vacant_units: number;
    occupancy_rate: number;
    created_at: string;
}

interface PaginatedBuildings {
    data: Building[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface BuildingsPageProps {
    buildings: PaginatedBuildings;
    availableManagers: Manager[];
    filters: { search: string };
    user: { name: string; email: string };
}

/* ------------------------------------------------------------------ */
/*  Create / Edit Modal                                                */
/* ------------------------------------------------------------------ */
function BuildingModal({
    open,
    onClose,
    building,
    managers,
}: {
    open: boolean;
    onClose: () => void;
    building: Building | null;
    managers: Manager[];
}) {
    const isEdit = !!building;

    const { data, setData, post, put, processing, errors, reset, transform } =
        useForm({
            name: building?.name ?? "",
            address: building?.address ?? "",
            manager_user_id: building?.manager?.id?.toString() ?? "",
        });

    useEffect(() => {
        if (open) {
            setData({
                name: building?.name ?? "",
                address: building?.address ?? "",
                manager_user_id: building?.manager?.id?.toString() ?? "",
            });
        }
    }, [open, building]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Transform empty manager to null
        transform((data) => ({
            ...data,
            manager_user_id: data.manager_user_id || null,
        }));
        if (isEdit) {
            put(`/buildings/${building!.id}`, {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post("/buildings", {
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
                        {isEdit ? "Edit Building" : "Add New Building"}
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
                    {/* Building Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Building Name{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                            placeholder="e.g. Ocean View Towers"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Address
                        </label>
                        <input
                            type="text"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                            placeholder="e.g. 123 Kigamboni St, Dar es Salaam"
                        />
                        {errors.address && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.address}
                            </p>
                        )}
                    </div>

                    {/* Manager */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Assign Manager{" "}
                            <span className="text-slate-400 text-xs font-normal">
                                (optional)
                            </span>
                        </label>
                        <select
                            value={data.manager_user_id}
                            onChange={(e) =>
                                setData("manager_user_id", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        >
                            <option value="">None (assign later)</option>
                            {managers.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.email})
                                </option>
                            ))}
                            {/* When editing, also show current manager */}
                            {isEdit &&
                                building?.manager &&
                                !managers.find(
                                    (m) => m.id === building.manager!.id,
                                ) && (
                                    <option value={building.manager.id}>
                                        {building.manager.name} (
                                        {building.manager.email})
                                    </option>
                                )}
                        </select>
                        {errors.manager_user_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.manager_user_id}
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
                                  ? "Update Building"
                                  : "Create Building"}
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
    buildingName,
    processing,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    buildingName: string;
    processing: boolean;
}) {
    const [confirmText, setConfirmText] = useState("");
    const nameMatches =
        confirmText.trim().toLowerCase() === buildingName.trim().toLowerCase();

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
                    Delete Building
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-slate-700">
                        {buildingName}
                    </span>
                    ? The building and its associated data will be archived and
                    can be restored later.
                </p>
                <div className="mt-4 text-left">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Type{" "}
                        <span className="font-bold text-slate-700">
                            {buildingName}
                        </span>{" "}
                        to confirm
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={buildingName}
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
                        {processing ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Occupancy bar                                                      */
/* ------------------------------------------------------------------ */
function OccupancyBar({ rate }: { rate: number }) {
    let barColor = "bg-emerald-500";
    if (rate < 70) barColor = "bg-red-500";
    else if (rate < 85) barColor = "bg-amber-500";

    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-slate-100">
                <div
                    className={`h-2 rounded-full ${barColor} transition-all`}
                    style={{ width: `${rate}%` }}
                />
            </div>
            <span className="text-xs font-semibold text-slate-700">
                {rate}%
            </span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Buildings Page                                                */
/* ------------------------------------------------------------------ */
export default function BuildingsIndex({
    buildings,
    availableManagers,
    filters,
    user,
}: BuildingsPageProps) {
    const [search, setSearch] = useState(filters.search);
    const [modalOpen, setModalOpen] = useState(false);
    const [editBuilding, setEditBuilding] = useState<Building | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
    const [deleting, setDeleting] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = (value: string) => {
        setSearch(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(
                "/buildings",
                { search: value || undefined },
                { preserveState: true, replace: true },
            );
        }, 300);
    };

    const handleEdit = (building: Building) => {
        setEditBuilding(building);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditBuilding(null);
        setModalOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/buildings/${deleteTarget.id}`, {
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const allManagers = editBuilding?.manager
        ? [
              ...availableManagers.filter(
                  (m) => m.id !== editBuilding.manager!.id,
              ),
              editBuilding.manager,
          ]
        : availableManagers;

    return (
        <AppLayout title="Buildings" activeNav="buildings" user={user}>
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
                    <span className="text-slate-600 font-medium">
                        Buildings
                    </span>
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
                    Add Building
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
                <SummaryCard
                    label="Total Buildings"
                    value={buildings.total.toString()}
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
                        </svg>
                    }
                    accent="text-emerald-600"
                />
                <SummaryCard
                    label="Total Units"
                    value={buildings.data
                        .reduce((sum, b) => sum + b.units_count, 0)
                        .toString()}
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM4.5 4A.5.5 0 004 4.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z" />
                        </svg>
                    }
                    accent="text-blue-600"
                />
                <SummaryCard
                    label="Occupied"
                    value={buildings.data
                        .reduce((sum, b) => sum + b.occupied_units, 0)
                        .toString()}
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
                    accent="text-emerald-600"
                />
                <SummaryCard
                    label="Vacant"
                    value={buildings.data
                        .reduce((sum, b) => sum + b.vacant_units, 0)
                        .toString()}
                    icon={
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                        </svg>
                    }
                    accent="text-orange-600"
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
                            placeholder="Search buildings..."
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        />
                    </div>
                    <p className="text-xs text-slate-400">
                        {buildings.total} building
                        {buildings.total !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Building
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Manager
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 text-center">
                                    Floors
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 text-center">
                                    Units
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Occupancy
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 text-center">
                                    Vacant
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                                    Added
                                </th>
                                <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {buildings.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-16 text-center"
                                    >
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                            <svg
                                                className="h-8 w-8"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
                                            </svg>
                                        </div>
                                        <p className="mt-4 text-sm font-semibold text-slate-600">
                                            No buildings found
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {filters.search
                                                ? "Try adjusting your search"
                                                : "Create your first building to get started"}
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
                                                Add Building
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                buildings.data.map((building) => (
                                    <tr
                                        key={building.id}
                                        className="group transition hover:bg-slate-50/50"
                                    >
                                        {/* Building */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {building.name}
                                                </p>
                                                {building.address && (
                                                    <p className="mt-0.5 text-xs text-slate-400 truncate max-w-[200px]">
                                                        {building.address}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Manager */}
                                        <td className="px-6 py-4">
                                            {building.manager ? (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-white">
                                                        {building.manager.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .toUpperCase()
                                                            .slice(0, 2)}
                                                    </div>
                                                    <span className="text-sm text-slate-700">
                                                        {building.manager.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>

                                        {/* Floors */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-medium text-slate-700">
                                                {building.floors_count}
                                            </span>
                                        </td>

                                        {/* Units */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-medium text-slate-700">
                                                {building.units_count}
                                            </span>
                                        </td>

                                        {/* Occupancy */}
                                        <td className="px-6 py-4">
                                            <OccupancyBar
                                                rate={building.occupancy_rate}
                                            />
                                        </td>

                                        {/* Vacant */}
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                                    building.vacant_units === 0
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                }`}
                                            >
                                                {building.vacant_units}
                                            </span>
                                        </td>

                                        {/* Added */}
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-500">
                                                {building.created_at}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(building)
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
                                                        setDeleteTarget(
                                                            building,
                                                        )
                                                    }
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
                {buildings.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                        <p className="text-xs text-slate-400">
                            Page {buildings.current_page} of{" "}
                            {buildings.last_page} · {buildings.total} total
                        </p>
                        <div className="flex items-center gap-1">
                            {buildings.links.map((link, i) => {
                                if (!link.url) return null;

                                // Skip "prev" and "next" string labels, use arrows
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
            <BuildingModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditBuilding(null);
                }}
                building={editBuilding}
                managers={allManagers}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                buildingName={deleteTarget?.name ?? ""}
                processing={deleting}
            />
        </AppLayout>
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
                    <p className={`mt-1.5 text-2xl font-bold text-slate-900`}>
                        {value}
                    </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition">
                    {icon}
                </div>
            </div>
        </div>
    );
}
