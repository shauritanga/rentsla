import React, { useState } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Floor {
    id: number;
    name: string;
    sequence: number;
    units_count: number;
    occupied_units: number;
    vacant_units: number;
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    floors: Floor[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Floors({ user, building, floors }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const form = useForm({
        name: "",
        sequence: 0,
    });

    function openCreate() {
        setEditingFloor(null);
        form.setData({ name: "", sequence: floors.length });
        form.clearErrors();
        setShowModal(true);
    }

    function openEdit(floor: Floor) {
        setEditingFloor(floor);
        form.setData({ name: floor.name, sequence: floor.sequence });
        form.clearErrors();
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingFloor(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingFloor) {
            form.put(`/manager/floors/${editingFloor.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            form.post("/manager/floors", {
                onSuccess: () => closeModal(),
            });
        }
    }

    function openDelete(floor: Floor) {
        setDeletingFloor(floor);
        setDeleteConfirmText("");
        setShowDeleteModal(true);
    }

    function handleDelete() {
        if (!deletingFloor) return;
        router.delete(`/manager/floors/${deletingFloor.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingFloor(null);
            },
        });
    }

    return (
        <ManagerLayout
            title="Floors"
            activeNav="floors"
            user={user}
            building={building}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Floors
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage floors in {building.name}
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
                    Add Floor
                </button>
            </div>

            {/* Table */}
            {floors.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-100">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <svg
                            className="h-7 w-7 text-slate-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V9zm0 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">
                        No floors yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Add your first floor to start organizing units.
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Floor Name
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Total Units
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Occupied
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Vacant
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {floors.map((floor) => (
                                <tr
                                    key={floor.id}
                                    className="hover:bg-slate-50/50 transition"
                                >
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {floor.sequence}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-slate-800">
                                            {floor.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                                        {floor.units_count}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                            {floor.occupied_units}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                            {floor.vacant_units}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(floor)}
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
                                                onClick={() =>
                                                    openDelete(floor)
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
                                                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022 1.005 11.36A2.75 2.75 0 007.77 20h4.46a2.75 2.75 0 002.751-2.689l1.005-11.36.149.022a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.5 6a.75.75 0 01-1.497-.124l.5-6a.75.75 0 01.797-.672zm3.54.697a.75.75 0 00-1.497.124l.5 6a.75.75 0 101.497-.124l-.5-6z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                            {editingFloor ? "Edit Floor" : "Add Floor"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Floor Name
                                </label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData("name", e.target.value)
                                    }
                                    placeholder="e.g., Ground Floor"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Floor Number (Sequence)
                                </label>
                                <input
                                    type="number"
                                    value={form.data.sequence}
                                    onChange={(e) =>
                                        form.setData(
                                            "sequence",
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                    min={0}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.sequence && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.sequence}
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
                                        : editingFloor
                                          ? "Update"
                                          : "Add Floor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingFloor && (
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
                            Delete Floor
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-700">
                                {deletingFloor.name}
                            </span>
                            ? All units on this floor will also be removed.
                        </p>
                        <div className="mt-4 text-left">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                Type{" "}
                                <span className="font-bold text-slate-700">
                                    {deletingFloor.name}
                                </span>{" "}
                                to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) =>
                                    setDeleteConfirmText(e.target.value)
                                }
                                placeholder={deletingFloor.name}
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
                                    deleteConfirmText.toLowerCase() !==
                                    deletingFloor.name.toLowerCase()
                                }
                                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
