import React, { useState, useEffect } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm, usePage } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface PermissionItem {
    id: number;
    name: string;
    group: string;
    description: string;
}

interface RoleItem {
    id: number;
    name: string;
    description: string | null;
    is_system: boolean;
    building_id: number | null;
    users_count: number;
    permissions: PermissionItem[];
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    roles: RoleItem[];
    permissionGroups: Record<string, PermissionItem[]>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const ROLE_LABELS: Record<string, string> = {
    accountant: "Accountant",
    lease_manager: "Lease Manager",
    maintenance_staff: "Maintenance Staff",
    viewer: "Viewer",
};

const GROUP_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    floors: "Floors",
    units: "Units",
    tenants: "Tenants",
    leases: "Leases",
    payments: "Payments",
    staff: "Staff",
    maintenance: "Maintenance",
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
    dashboard: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
    ),
    floors: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v2H7V5zm6 4H7v2h6V9zm-6 4h6v2H7v-2z"
                clipRule="evenodd"
            />
        </svg>
    ),
    units: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M1 2.75A.75.75 0 011.75 2h16.5a.75.75 0 010 1.5H18v8.75A2.75 2.75 0 0115.25 15h-1.072l.798 3.06a.75.75 0 01-1.452.38L13.41 18H6.59l-.114.44a.75.75 0 01-1.452-.38L5.823 15H4.75A2.75 2.75 0 012 12.25V3.5h-.25A.75.75 0 011 2.75z"
                clipRule="evenodd"
            />
        </svg>
    ),
    tenants: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
        </svg>
    ),
    leases: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 00-1.5 0v2.546l-.943-1.048a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.114 0l2.25-2.5a.75.75 0 00-1.114-1.004l-.943 1.048V8.75z"
                clipRule="evenodd"
            />
        </svg>
    ),
    payments: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm12-1a1 1 0 11-2 0 1 1 0 012 0z"
                clipRule="evenodd"
            />
        </svg>
    ),
    staff: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
        </svg>
    ),
    maintenance: (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.11 3.01 3.01 0 01-1.618-1.616.455.455 0 01.11-.494l2.694-2.692c.24-.241.174-.647-.15-.752a4.5 4.5 0 00-5.873 4.575c.055.873-.128 1.808-.8 2.368l-7.23 6.024a2.724 2.724 0 103.837 3.837l6.024-7.23c.56-.672 1.495-.855 2.368-.8.18.012.362.017.547.017z"
                clipRule="evenodd"
            />
        </svg>
    ),
};

function humanize(name: string): string {
    return (
        ROLE_LABELS[name] ||
        name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Roles({
    user,
    building,
    roles,
    permissionGroups,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedRole, setExpandedRole] = useState<number | null>(null);

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

    // All permission IDs flattened
    const allPermIds = Object.values(permissionGroups)
        .flat()
        .map((p) => p.id);

    const form = useForm<{
        name: string;
        description: string;
        permissions: number[];
    }>({
        name: "",
        description: "",
        permissions: [],
    });

    function openCreate() {
        setEditingRole(null);
        form.setData({ name: "", description: "", permissions: [] });
        form.clearErrors();
        setShowModal(true);
    }

    function openEdit(role: RoleItem) {
        setEditingRole(role);
        form.setData({
            name: humanize(role.name),
            description: role.description || "",
            permissions: role.permissions.map((p) => p.id),
        });
        form.clearErrors();
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingRole(null);
    }

    function togglePermission(permId: number) {
        const current = form.data.permissions;
        if (current.includes(permId)) {
            form.setData(
                "permissions",
                current.filter((id) => id !== permId),
            );
        } else {
            form.setData("permissions", [...current, permId]);
        }
    }

    function toggleGroup(groupPerms: PermissionItem[]) {
        const groupIds = groupPerms.map((p) => p.id);
        const allSelected = groupIds.every((id) =>
            form.data.permissions.includes(id),
        );
        if (allSelected) {
            form.setData(
                "permissions",
                form.data.permissions.filter((id) => !groupIds.includes(id)),
            );
        } else {
            const merged = new Set([...form.data.permissions, ...groupIds]);
            form.setData("permissions", Array.from(merged));
        }
    }

    function selectAll() {
        form.setData("permissions", [...allPermIds]);
    }

    function deselectAll() {
        form.setData("permissions", []);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingRole) {
            form.put(`/manager/roles/${editingRole.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            form.post("/manager/roles", {
                onSuccess: () => closeModal(),
            });
        }
    }

    function openDelete(role: RoleItem) {
        setDeletingRole(role);
        setDeleteConfirmText("");
        setShowDeleteModal(true);
    }

    function handleDelete() {
        if (!deletingRole) return;
        setIsDeleting(true);
        router.delete(`/manager/roles/${deletingRole.id}`, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingRole(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    }

    // Separate system (default) and custom roles
    const systemRoles = roles.filter((r) => r.is_system);
    const customRoles = roles.filter((r) => !r.is_system);

    return (
        <ManagerLayout
            title="Roles"
            activeNav="roles"
            user={user}
            building={building}
        >
            {/* Toast */}
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
                    <h1 className="text-2xl font-bold text-slate-900">
                        Roles & Permissions
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage roles and control what each role can access in{" "}
                        {building.name}
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
                    Create Role
                </button>
            </div>

            {/* Default Roles Section */}
            {systemRoles.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Default Roles
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            Read-only
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {systemRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                expanded={expandedRole === role.id}
                                onToggle={() =>
                                    setExpandedRole(
                                        expandedRole === role.id
                                            ? null
                                            : role.id,
                                    )
                                }
                                permissionGroups={permissionGroups}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Custom Roles Section */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Custom Roles
                    {customRoles.length > 0 && (
                        <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                            {customRoles.length}
                        </span>
                    )}
                </h2>
                {customRoles.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-slate-100 p-12 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                            <svg
                                className="h-6 w-6 text-blue-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.157 2.176a1.5 1.5 0 00-1.147 0l-4.084 1.69A1.5 1.5 0 002 5.25v2.303c0 2.092.518 4.15 1.457 5.876A12.22 12.22 0 007.96 18.3a1.5 1.5 0 001.578.08 12.19 12.19 0 004.492-4.793A14.862 14.862 0 0015.5 7.554V5.25a1.5 1.5 0 00-.926-1.385l-4.084-1.69zM10 8a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                            No custom roles yet
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Create a custom role to define exactly what your
                            staff can access.
                        </p>
                        <button
                            onClick={openCreate}
                            className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                        >
                            Create your first role
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {customRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                expanded={expandedRole === role.id}
                                onToggle={() =>
                                    setExpandedRole(
                                        expandedRole === role.id
                                            ? null
                                            : role.id,
                                    )
                                }
                                permissionGroups={permissionGroups}
                                onEdit={() => openEdit(role)}
                                onDelete={() => openDelete(role)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingRole ? "Edit Role" : "Create Role"}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {editingRole
                                    ? "Update this role's name and permissions."
                                    : "Define a new role and choose what it can do."}
                            </p>
                        </div>
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col flex-1 overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                                {/* Name & Description */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Role Name
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.name}
                                            onChange={(e) =>
                                                form.setData(
                                                    "name",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g., Front Desk"
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
                                            Description{" "}
                                            <span className="text-slate-400 font-normal">
                                                (optional)
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.description}
                                            onChange={(e) =>
                                                form.setData(
                                                    "description",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Brief description of this role"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                        />
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Permissions
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={selectAll}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                                            >
                                                Select all
                                            </button>
                                            <span className="text-slate-300">
                                                |
                                            </span>
                                            <button
                                                type="button"
                                                onClick={deselectAll}
                                                className="text-xs text-slate-500 hover:text-slate-700 font-medium transition"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    </div>
                                    {form.errors.permissions && (
                                        <p className="mb-2 text-xs text-red-500">
                                            {form.errors.permissions}
                                        </p>
                                    )}
                                    <div className="space-y-3">
                                        {Object.entries(permissionGroups).map(
                                            ([group, perms]) => {
                                                const groupIds = perms.map(
                                                    (p) => p.id,
                                                );
                                                const selectedCount =
                                                    groupIds.filter((id) =>
                                                        form.data.permissions.includes(
                                                            id,
                                                        ),
                                                    ).length;
                                                const allSelected =
                                                    selectedCount ===
                                                    groupIds.length;
                                                const someSelected =
                                                    selectedCount > 0 &&
                                                    !allSelected;

                                                return (
                                                    <div
                                                        key={group}
                                                        className="rounded-xl border border-slate-200 overflow-hidden"
                                                    >
                                                        {/* Group header */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleGroup(
                                                                    perms,
                                                                )
                                                            }
                                                            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition text-left"
                                                        >
                                                            <div
                                                                className={`flex h-4.5 w-4.5 items-center justify-center rounded border transition ${
                                                                    allSelected
                                                                        ? "bg-blue-500 border-blue-500"
                                                                        : someSelected
                                                                          ? "bg-blue-200 border-blue-400"
                                                                          : "border-slate-300"
                                                                }`}
                                                            >
                                                                {(allSelected ||
                                                                    someSelected) && (
                                                                    <svg
                                                                        className="h-3 w-3 text-white"
                                                                        viewBox="0 0 12 12"
                                                                        fill="currentColor"
                                                                    >
                                                                        {allSelected ? (
                                                                            <path d="M9.765 3.205a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 111.06-1.06L4.735 7.17l3.97-3.97a.75.75 0 011.06.005z" />
                                                                        ) : (
                                                                            <path d="M3 5.25h6a.75.75 0 010 1.5H3a.75.75 0 010-1.5z" />
                                                                        )}
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <span className="text-slate-500">
                                                                {GROUP_ICONS[
                                                                    group
                                                                ] || null}
                                                            </span>
                                                            <span className="text-sm font-semibold text-slate-700 capitalize">
                                                                {GROUP_LABELS[
                                                                    group
                                                                ] || group}
                                                            </span>
                                                            <span className="ml-auto text-xs text-slate-400">
                                                                {selectedCount}/
                                                                {
                                                                    groupIds.length
                                                                }
                                                            </span>
                                                        </button>
                                                        {/* Individual permissions */}
                                                        <div className="divide-y divide-slate-100">
                                                            {perms.map(
                                                                (perm) => {
                                                                    const checked =
                                                                        form.data.permissions.includes(
                                                                            perm.id,
                                                                        );
                                                                    return (
                                                                        <label
                                                                            key={
                                                                                perm.id
                                                                            }
                                                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                    checked
                                                                                }
                                                                                onChange={() =>
                                                                                    togglePermission(
                                                                                        perm.id,
                                                                                    )
                                                                                }
                                                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <span className="text-sm font-medium text-slate-700">
                                                                                    {perm.description ||
                                                                                        perm.name}
                                                                                </span>
                                                                                <span className="ml-2 text-xs text-slate-400">
                                                                                    {
                                                                                        perm.name
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-400">
                                        {form.data.permissions.length} of{" "}
                                        {allPermIds.length} permissions selected
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                                    className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50"
                                >
                                    {form.processing
                                        ? "Saving..."
                                        : editingRole
                                          ? "Update Role"
                                          : "Create Role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingRole && (
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
                            Delete Role
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-700">
                                {humanize(deletingRole.name)}
                            </span>
                            ? This action cannot be undone.
                        </p>
                        {deletingRole.users_count > 0 && (
                            <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                                This role has {deletingRole.users_count} staff
                                member{deletingRole.users_count !== 1 && "s"}.
                                You must reassign them before deleting.
                            </p>
                        )}
                        <div className="mt-4 text-left">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                Type{" "}
                                <span className="font-bold text-slate-700">
                                    {humanize(deletingRole.name)}
                                </span>{" "}
                                to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) =>
                                    setDeleteConfirmText(e.target.value)
                                }
                                placeholder={humanize(deletingRole.name)}
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
                                        humanize(
                                            deletingRole.name,
                                        ).toLowerCase()
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

/* ------------------------------------------------------------------ */
/*  Role Card                                                          */
/* ------------------------------------------------------------------ */
function RoleCard({
    role,
    expanded,
    onToggle,
    permissionGroups,
    onEdit,
    onDelete,
}: {
    role: RoleItem;
    expanded: boolean;
    onToggle: () => void;
    permissionGroups: Record<string, PermissionItem[]>;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const rolePermIds = new Set(role.permissions.map((p) => p.id));

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden transition hover:shadow-md">
            {/* Card header */}
            <div className="px-5 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                            {humanize(role.name)}
                        </h3>
                        {role.is_system && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Default
                            </span>
                        )}
                    </div>
                    {role.description && (
                        <p className="mt-0.5 text-sm text-slate-500 truncate">
                            {role.description}
                        </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                            </svg>
                            {role.users_count} staff
                        </span>
                        <span className="flex items-center gap-1">
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.157 2.176a1.5 1.5 0 00-1.147 0l-4.084 1.69A1.5 1.5 0 002 5.25v2.303c0 2.092.518 4.15 1.457 5.876A12.22 12.22 0 007.96 18.3a1.5 1.5 0 001.578.08 12.19 12.19 0 004.492-4.793A14.862 14.862 0 0015.5 7.554V5.25a1.5 1.5 0 00-.926-1.385l-4.084-1.69zM10 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {role.permissions.length} permissions
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {!role.is_system && onEdit && (
                        <button
                            onClick={onEdit}
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
                    )}
                    {!role.is_system && onDelete && (
                        <button
                            onClick={onDelete}
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
                    )}
                    <button
                        onClick={onToggle}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        title={
                            expanded ? "Hide permissions" : "Show permissions"
                        }
                    >
                        <svg
                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded permissions */}
            {expanded && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                    <div className="space-y-3">
                        {Object.entries(permissionGroups).map(
                            ([group, perms]) => {
                                const groupHasAny = perms.some((p) =>
                                    rolePermIds.has(p.id),
                                );
                                if (!groupHasAny) return null;
                                return (
                                    <div key={group}>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 capitalize flex items-center gap-1.5">
                                            <span className="text-slate-400">
                                                {GROUP_ICONS[group] || null}
                                            </span>
                                            {GROUP_LABELS[group] || group}
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {perms.map((p) => (
                                                <span
                                                    key={p.id}
                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                        rolePermIds.has(p.id)
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-slate-100 text-slate-400 line-through"
                                                    }`}
                                                >
                                                    {rolePermIds.has(p.id) ? (
                                                        <svg
                                                            className="h-3 w-3 mr-1 text-emerald-500"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    ) : null}
                                                    {p.description || p.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
