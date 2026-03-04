import React, { useState, useEffect } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm, usePage } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface RoleOption {
    id: number;
    name: string;
}

interface StaffMember {
    id: number;
    name: string;
    email: string;
    roles: RoleOption[];
    created_at: string;
}

interface Permission {
    id: number;
    name: string;
    group: string;
    description: string;
}

interface PaginatedStaff {
    data: StaffMember[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    staff: PaginatedStaff;
    roles: RoleOption[];
    permissions: Permission[];
    rolePermissions: Record<number, string[]>;
    filters: { search: string; role: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const ROLE_LABELS: Record<string, string> = {
    accountant: "Accountant",
    lease_manager: "Lease Manager",
    maintenance_staff: "Maintenance Staff",
    viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
    accountant: "bg-violet-50 text-violet-700",
    lease_manager: "bg-blue-50 text-blue-700",
    maintenance_staff: "bg-amber-50 text-amber-700",
    viewer: "bg-slate-100 text-slate-600",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Staff({
    user,
    building,
    staff,
    roles,
    permissions,
    rolePermissions,
    filters,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(
        null,
    );
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingMember, setDeletingMember] = useState<StaffMember | null>(
        null,
    );
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

    const [search, setSearch] = useState(filters.search);
    const [roleFilter, setRoleFilter] = useState(filters.role);

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

    const form = useForm({
        name: "",
        email: "",
        password: "",
        role_id: "",
    });

    function applyFilters() {
        router.get(
            "/manager/staff",
            {
                search: search || undefined,
                role: roleFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function clearFilters() {
        setSearch("");
        setRoleFilter("");
        router.get(
            "/manager/staff",
            {},
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        setEditingMember(null);
        form.setData({
            name: "",
            email: "",
            password: "",
            role_id: roles[0]?.id?.toString() || "",
        });
        form.clearErrors();
        setShowModal(true);
    }

    function openEdit(member: StaffMember) {
        setEditingMember(member);
        form.setData({
            name: member.name,
            email: member.email,
            password: "",
            role_id: member.roles[0]?.id?.toString() || "",
        });
        form.clearErrors();
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingMember(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingMember) {
            form.put(`/manager/staff/${editingMember.id}`, {
                onSuccess: () => closeModal(),
                onError: () => {
                    setToast({
                        message: "Failed to update staff member.",
                        type: "error",
                    });
                },
            });
        } else {
            form.post("/manager/staff", {
                onSuccess: () => closeModal(),
                onError: () => {
                    setToast({
                        message: "Failed to create staff member.",
                        type: "error",
                    });
                },
            });
        }
    }

    function openDelete(member: StaffMember) {
        setDeletingMember(member);
        setDeleteConfirmText("");
        setShowDeleteModal(true);
    }

    function handleDelete() {
        if (!deletingMember) return;
        setIsDeleting(true);
        router.delete(`/manager/staff/${deletingMember.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingMember(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
                setToast({
                    message: "Failed to remove staff member.",
                    type: "error",
                });
            },
        });
    }

    function viewPermissions(roleId: number) {
        setSelectedRoleId(roleId);
        setShowPermissions(true);
    }

    const selectedPerms = selectedRoleId
        ? rolePermissions[selectedRoleId] || []
        : [];

    // Group permissions by group
    const groupedPermissions: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
        if (!groupedPermissions[p.group]) groupedPermissions[p.group] = [];
        groupedPermissions[p.group].push(p);
    });

    return (
        <ManagerLayout
            title="Staff"
            activeNav="staff"
            user={user}
            building={building}
        >
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 right-6 z-[60]">
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
                    <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {staff.total} staff member
                        {staff.total !== 1 ? "s" : ""} in {building.name}
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
                    Add Staff
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
                        placeholder="Name or email..."
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition w-52"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        Role
                    </label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    >
                        <option value="">All Roles</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.name}>
                                {ROLE_LABELS[r.name] || r.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={applyFilters}
                    className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                    Filter
                </button>
                {(filters.search || filters.role) && (
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
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Added
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staff.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-12 text-center text-sm text-slate-400"
                                >
                                    No staff members found.
                                </td>
                            </tr>
                        ) : (
                            staff.data.map((member) => (
                                <tr
                                    key={member.id}
                                    className="hover:bg-slate-50/50 transition"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
                                                {member.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-800">
                                                {member.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {member.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {member.roles.map((role) => (
                                                <button
                                                    key={role.id}
                                                    onClick={() =>
                                                        viewPermissions(role.id)
                                                    }
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize cursor-pointer hover:opacity-80 transition ${
                                                        ROLE_COLORS[
                                                            role.name
                                                        ] ||
                                                        "bg-slate-100 text-slate-600"
                                                    }`}
                                                    title="Click to view permissions"
                                                >
                                                    {ROLE_LABELS[role.name] ||
                                                        role.name}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {member.created_at}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openEdit(member)}
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
                                                    openDelete(member)
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
            {staff.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {staff.links.map((link, i) => (
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
                            {editingMember ? "Edit Staff Member" : "Add Staff"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData("name", e.target.value)
                                    }
                                    placeholder="e.g., John Doe"
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
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData("email", e.target.value)
                                    }
                                    placeholder="e.g., john@example.com"
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
                                    Password
                                    {editingMember && (
                                        <span className="text-slate-400 font-normal">
                                            {" "}
                                            (leave blank to keep current)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData("password", e.target.value)
                                    }
                                    placeholder={
                                        editingMember
                                            ? "••••••••"
                                            : "Min 8 characters"
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {form.errors.password && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.password}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={form.data.role_id}
                                    onChange={(e) =>
                                        form.setData("role_id", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    <option value="">Select role</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {ROLE_LABELS[r.name] || r.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.role_id && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {form.errors.role_id}
                                    </p>
                                )}
                                {/* Show role permissions preview */}
                                {form.data.role_id && (
                                    <div className="mt-2 rounded-lg bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-500 mb-1.5">
                                            This role can:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {(
                                                rolePermissions[
                                                    parseInt(form.data.role_id)
                                                ] || []
                                            ).map((perm) => (
                                                <span
                                                    key={perm}
                                                    className="inline-flex rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                                                >
                                                    {perm
                                                        .replace(".", " ")
                                                        .replace("_", " ")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
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
                                        : editingMember
                                          ? "Update"
                                          : "Add Staff"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingMember && (
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
                            Remove Staff Member
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-slate-700">
                                {deletingMember.name}
                            </span>{" "}
                            from {building.name}? They will lose access to this
                            building.
                        </p>
                        <div className="mt-4 text-left">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                Type{" "}
                                <span className="font-bold text-slate-700">
                                    {deletingMember.name}
                                </span>{" "}
                                to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) =>
                                    setDeleteConfirmText(e.target.value)
                                }
                                placeholder={deletingMember.name}
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
                                        deletingMember.name.toLowerCase()
                                }
                                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isDeleting ? "Removing..." : "Remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {showPermissions && selectedRoleId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowPermissions(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">
                            Role Permissions
                        </h2>
                        <p className="text-sm text-slate-500 mb-5">
                            Permissions for{" "}
                            <span className="font-semibold text-slate-700 capitalize">
                                {ROLE_LABELS[
                                    roles.find((r) => r.id === selectedRoleId)
                                        ?.name || ""
                                ] ||
                                    roles.find((r) => r.id === selectedRoleId)
                                        ?.name}
                            </span>
                        </p>
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                            {Object.entries(groupedPermissions).map(
                                ([group, perms]) => (
                                    <div key={group}>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 capitalize">
                                            {group}
                                        </h3>
                                        <div className="space-y-1.5">
                                            {perms.map((p) => {
                                                const hasIt =
                                                    selectedPerms.includes(
                                                        p.name,
                                                    );
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                                                            hasIt
                                                                ? "bg-emerald-50"
                                                                : "bg-slate-50"
                                                        }`}
                                                    >
                                                        {hasIt ? (
                                                            <svg
                                                                className="h-4 w-4 text-emerald-500 shrink-0"
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
                                                                className="h-4 w-4 text-slate-300 shrink-0"
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
                                                        <div>
                                                            <span
                                                                className={`font-medium ${hasIt ? "text-emerald-800" : "text-slate-400"}`}
                                                            >
                                                                {p.description ||
                                                                    p.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={() => setShowPermissions(false)}
                                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
