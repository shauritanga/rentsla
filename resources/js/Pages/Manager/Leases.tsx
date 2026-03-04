import React, {
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback,
} from "react";
import { createPortal } from "react-dom";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { router, useForm } from "@inertiajs/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface LeaseUnit {
    id: number;
    unit_number: string;
    floor: string | null;
    area_sqm: number;
    rent_amount: number;
    rent_currency: string;
}

interface LeaseTenant {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
}

interface LeaseApprovalRecord {
    id: number;
    role: string;
    action: string;
    comment: string | null;
    approver_name: string | null;
    acted_at: string | null;
}

interface LeaseAmendmentRecord {
    id: number;
    current_area_sqm: number;
    proposed_area_sqm: number;
    current_monthly_rent: number;
    proposed_monthly_rent: number;
    reason: string | null;
    status: string;
    requester_name: string | null;
    reviewer_name: string | null;
    review_comment: string | null;
    reviewed_at: string | null;
    created_at: string;
}

interface Lease {
    id: number;
    unit: LeaseUnit;
    tenant: LeaseTenant;
    start_date: string;
    end_date: string | null;
    monthly_rent: number;
    deposit_amount: number;
    rent_currency: string;
    billing_cycle_months: number;
    rental_period_years: number | null;
    fitout_applicable: boolean;
    fitout_start_date: string | null;
    fitout_end_date: string | null;
    status: string;
    created_by_name: string | null;
    approvals: LeaseApprovalRecord[];
    amendments: LeaseAmendmentRecord[];
}

interface VacantUnit {
    id: number;
    unit_number: string;
    floor: string | null;
    area_sqm: number;
    rent_amount: number;
    rent_currency: string;
    unit_type: string | null;
}

interface ExistingTenant {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
}

interface PaginatedLeases {
    data: Lease[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    leases: PaginatedLeases;
    vacantUnits: VacantUnit[];
    existingTenants: ExistingTenant[];
    stats: {
        active: number;
        expired: number;
        terminated: number;
        pending: number;
        rejected: number;
    };
    filters: { search: string; status: string };
    userRole: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatCurrency(amount: number, currency: string = "TZS") {
    return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        active: "bg-emerald-50 text-emerald-700",
        expired: "bg-amber-50 text-amber-700",
        terminated: "bg-red-50 text-red-700",
        pending_accountant: "bg-orange-50 text-orange-700",
        pending_manager: "bg-blue-50 text-blue-700",
        rejected: "bg-rose-50 text-rose-700",
    };
    const dotMap: Record<string, string> = {
        active: "bg-emerald-500",
        expired: "bg-amber-500",
        terminated: "bg-red-500",
        pending_accountant: "bg-orange-500",
        pending_manager: "bg-blue-500",
        rejected: "bg-rose-500",
    };
    const labelMap: Record<string, string> = {
        pending_accountant: "Pending Accountant",
        pending_manager: "Pending Manager",
    };
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                map[status] || "bg-slate-100 text-slate-600"
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${
                    dotMap[status] || "bg-slate-400"
                }`}
            />
            {labelMap[status] || status}
        </span>
    );
}

/** Add years to a date string (YYYY-MM-DD) and return YYYY-MM-DD */
function addYears(dateStr: string, years: number): string {
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().split("T")[0];
}

const RENTAL_PERIODS = Array.from({ length: 15 }, (_, i) => i + 1);

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export default function Leases({
    user,
    building,
    leases,
    vacantUnits,
    existingTenants,
    stats,
    filters,
    userRole,
}: Props) {
    function canEditRejected(lease: Lease): boolean {
        // Allow editing if lease is rejected and user is creator or manager
        return (
            lease.status === "rejected" &&
            (userRole === "manager" || lease.created_by_name === user.name)
        );
    }
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLease, setEditingLease] = useState<Lease | null>(null);
    const [tenantMode, setTenantMode] = useState<"existing" | "new">(
        "existing",
    );
    const [search, setSearch] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [rejectingLease, setRejectingLease] = useState<Lease | null>(null);
    const [rejectComment, setRejectComment] = useState("");
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [approveProcessing, setApproveProcessing] = useState<number | null>(
        null,
    );

    /* Amendment state */
    const [amendingLease, setAmendingLease] = useState<Lease | null>(null);
    const [amendArea, setAmendArea] = useState("");
    const [amendReason, setAmendReason] = useState("");
    const [amendProcessing, setAmendProcessing] = useState(false);
    const [rejectingAmendment, setRejectingAmendment] = useState<{
        id: number;
        lease: Lease;
    } | null>(null);
    const [amendRejectComment, setAmendRejectComment] = useState("");
    const [amendRejectProcessing, setAmendRejectProcessing] = useState(false);
    const [approveAmendProcessing, setApproveAmendProcessing] = useState<
        number | null
    >(null);
    const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
    const [menuPos, setMenuPos] = useState<{
        top: number;
        left: number;
        openUp: boolean;
    }>({ top: 0, left: 0, openUp: false });
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const actionBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

    /* Position the dropdown relative to viewport using the button rect */
    const toggleActionMenu = useCallback(
        (leaseId: number) => {
            if (openActionMenu === leaseId) {
                setOpenActionMenu(null);
                return;
            }
            const btn = actionBtnRefs.current[leaseId];
            if (btn) {
                const rect = btn.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const openUp = spaceBelow < 260;
                setMenuPos({
                    top: openUp
                        ? rect.top + window.scrollY
                        : rect.bottom + window.scrollY + 4,
                    left: rect.right + window.scrollX - 224, // 224 = w-56
                    openUp,
                });
            }
            setOpenActionMenu(leaseId);
        },
        [openActionMenu],
    );

    /* Close action menu on outside click */
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                actionMenuRef.current &&
                !actionMenuRef.current.contains(e.target as Node) &&
                !Object.values(actionBtnRefs.current).some((btn) =>
                    btn?.contains(e.target as Node),
                )
            ) {
                setOpenActionMenu(null);
            }
        }
        if (openActionMenu !== null) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [openActionMenu]);

    /* ── Poll for lease status changes every 10 seconds ── */
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ["leases", "stats"] });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const createForm = useForm({
        unit_id: "",
        tenant_id: "",
        tenant_name: "",
        tenant_email: "",
        tenant_phone: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        rental_period_years: "",
        billing_cycle_months: "3",
        fitout_applicable: false as boolean,
        fitout_start_date: "",
        fitout_end_date: "",
        deposit_amount: "",
    });

    const editForm = useForm({
        monthly_rent: "",
        end_date: "",
        status: "active",
    });

    /* Selected unit pricing info */
    const selectedUnit = useMemo(() => {
        if (!createForm.data.unit_id) return null;
        return (
            vacantUnits.find((u) => u.id === Number(createForm.data.unit_id)) ||
            null
        );
    }, [createForm.data.unit_id, vacantUnits]);

    const calculatedRent = useMemo(() => {
        if (!selectedUnit) return 0;
        return selectedUnit.area_sqm * selectedUnit.rent_amount;
    }, [selectedUnit]);

    const rentCurrency = selectedUnit?.rent_currency ?? "TZS";

    /* Auto-calculate end date when start_date or rental_period changes */
    function handleStartDateChange(value: string) {
        const endDate =
            value && createForm.data.rental_period_years
                ? addYears(value, Number(createForm.data.rental_period_years))
                : createForm.data.end_date;
        createForm.setData({
            ...createForm.data,
            start_date: value,
            end_date: endDate,
        });
    }

    function handleRentalPeriodChange(value: string) {
        const endDate =
            value && createForm.data.start_date
                ? addYears(createForm.data.start_date, Number(value))
                : "";
        createForm.setData({
            ...createForm.data,
            rental_period_years: value,
            end_date: endDate,
        });
    }

    function applyFilters() {
        router.get(
            "/manager/leases",
            {
                search: search || undefined,
                status: statusFilter || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function clearFilters() {
        setSearch("");
        setStatusFilter("");
        router.get(
            "/manager/leases",
            {},
            { preserveState: true, replace: true },
        );
    }

    function openCreate() {
        setTenantMode("existing");
        createForm.setData({
            unit_id: "",
            tenant_id: "",
            tenant_name: "",
            tenant_email: "",
            tenant_phone: "",
            start_date: new Date().toISOString().split("T")[0],
            end_date: "",
            rental_period_years: "",
            billing_cycle_months: "3",
            fitout_applicable: false,
            fitout_start_date: "",
            fitout_end_date: "",
            deposit_amount: "",
        });
        createForm.clearErrors();
        setShowCreateModal(true);
    }

    function openEdit(lease: Lease) {
        setEditingLease(lease);
        editForm.setData({
            monthly_rent: lease.monthly_rent.toString(),
            end_date: lease.end_date || "",
            status:
                lease.status === "rejected"
                    ? "pending_accountant"
                    : lease.status, // Resubmit as pending if rejected
        });
        editForm.clearErrors();
        setShowEditModal(true);
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post("/manager/leases", {
            onSuccess: () => setShowCreateModal(false),
            onError: (errors) => {
                console.error("Lease creation errors:", errors);
            },
        });
    }

    function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editingLease) return;
        // If editing a rejected lease, resubmit as pending_accountant
        const data = { ...editForm.data };
        if (editingLease.status === "rejected") {
            data.status = "pending_accountant";
        }
        editForm.put(`/manager/leases/${editingLease.id}`, {
            onSuccess: () => {
                setShowEditModal(false);
                setEditingLease(null);
            },
        });
    }

    function canApprove(lease: Lease): boolean {
        // Strict chain: accountant approves at pending_accountant, manager at pending_manager
        if (lease.status === "pending_accountant" && userRole === "accountant")
            return true;
        if (lease.status === "pending_manager" && userRole === "manager")
            return true;
        return false;
    }

    function canReject(lease: Lease): boolean {
        return canApprove(lease);
    }

    // Approve modal state
    const [approvingLease, setApprovingLease] = useState<Lease | null>(null);
    const [approveComment, setApproveComment] = useState("");

    function handleApprove(lease: Lease) {
        setApprovingLease(lease);
        setApproveComment("");
    }

    function handleApproveSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!approvingLease) return;
        setApproveProcessing(approvingLease.id);
        router.post(
            `/manager/leases/${approvingLease.id}/approve`,
            { comment: approveComment },
            {
                onSuccess: () => {
                    setApprovingLease(null);
                    setApproveComment("");
                },
                onFinish: () => setApproveProcessing(null),
            },
        );
    }

    function handleReject(e: React.FormEvent) {
        e.preventDefault();
        if (!rejectingLease) return;
        setRejectProcessing(true);
        router.post(
            `/manager/leases/${rejectingLease.id}/reject`,
            {
                comment: rejectComment,
            },
            {
                onSuccess: () => {
                    setRejectingLease(null);
                    setRejectComment("");
                },
                onFinish: () => setRejectProcessing(false),
            },
        );
    }

    /* ── Amendment handlers ──────────────────────────────── */

    function openAmendment(lease: Lease) {
        setAmendingLease(lease);
        setAmendArea(lease.unit.area_sqm.toString());
        setAmendReason("");
        setAmendProcessing(false);
    }

    function hasPendingAmendment(lease: Lease): boolean {
        return lease.amendments.some((a) => a.status === "pending_manager");
    }

    function getPendingAmendment(
        lease: Lease,
    ): LeaseAmendmentRecord | undefined {
        return lease.amendments.find((a) => a.status === "pending_manager");
    }

    const amendCalculatedRent = useMemo(() => {
        if (!amendingLease || !amendArea) return 0;
        return parseFloat(amendArea) * amendingLease.unit.rent_amount;
    }, [amendingLease, amendArea]);

    function handleAmendmentRequest(e: React.FormEvent) {
        e.preventDefault();
        if (!amendingLease) return;
        setAmendProcessing(true);
        router.post(
            `/manager/leases/${amendingLease.id}/amendments`,
            {
                proposed_area_sqm: amendArea,
                reason: amendReason || undefined,
            },
            {
                onSuccess: () => {
                    setAmendingLease(null);
                    setAmendArea("");
                    setAmendReason("");
                },
                onFinish: () => setAmendProcessing(false),
            },
        );
    }

    function handleApproveAmendment(amendmentId: number) {
        setApproveAmendProcessing(amendmentId);
        router.post(
            `/manager/leases/amendments/${amendmentId}/approve`,
            {},
            {
                onFinish: () => setApproveAmendProcessing(null),
            },
        );
    }

    function handleRejectAmendment(e: React.FormEvent) {
        e.preventDefault();
        if (!rejectingAmendment) return;
        setAmendRejectProcessing(true);
        router.post(
            `/manager/leases/amendments/${rejectingAmendment.id}/reject`,
            {
                comment: amendRejectComment,
            },
            {
                onSuccess: () => {
                    setRejectingAmendment(null);
                    setAmendRejectComment("");
                },
                onFinish: () => setAmendRejectProcessing(false),
            },
        );
    }

    return (
        <ManagerLayout
            title="Leases"
            activeNav="leases"
            user={user}
            building={building}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Leases
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage lease agreements for {building.name}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={vacantUnits.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    New Lease
                </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-2xl font-bold text-emerald-600">
                        {stats.active}
                    </p>
                    <p className="text-xs text-slate-500">Active</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-2xl font-bold text-orange-600">
                        {stats.pending}
                    </p>
                    <p className="text-xs text-slate-500">Pending</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-2xl font-bold text-rose-600">
                        {stats.rejected}
                    </p>
                    <p className="text-xs text-slate-500">Rejected</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-2xl font-bold text-amber-600">
                        {stats.expired}
                    </p>
                    <p className="text-xs text-slate-500">Expired</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <p className="text-2xl font-bold text-red-600">
                        {stats.terminated}
                    </p>
                    <p className="text-xs text-slate-500">Terminated</p>
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
                        placeholder="Tenant or unit..."
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition w-48"
                    />
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
                        <option value="active">Active</option>
                        <option value="pending_accountant">
                            Pending Accountant
                        </option>
                        <option value="pending_manager">Pending Manager</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>
                <button
                    onClick={applyFilters}
                    className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                    Filter
                </button>
                {(filters.search || filters.status) && (
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
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Area (sqm)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Tenant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Period
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Monthly Rent
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Fit-out
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
                        {leases.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-6 py-12 text-center text-sm text-slate-400"
                                >
                                    No leases found.
                                </td>
                            </tr>
                        ) : (
                            leases.data.map((lease) => (
                                <tr
                                    key={lease.id}
                                    className="hover:bg-slate-50/50 transition"
                                >
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {lease.unit.unit_number}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {lease.unit.floor || ""}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-700">
                                        {lease.unit.area_sqm}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-800">
                                            {lease.tenant.full_name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {lease.tenant.phone ||
                                                lease.tenant.email ||
                                                ""}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600">
                                            {new Date(
                                                lease.start_date,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {lease.end_date
                                                ? `to ${new Date(
                                                      lease.end_date,
                                                  ).toLocaleDateString(
                                                      "en-GB",
                                                      {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                      },
                                                  )}`
                                                : "Open-ended"}
                                            {lease.rental_period_years
                                                ? ` (${lease.rental_period_years}yr${lease.rental_period_years > 1 ? "s" : ""})`
                                                : ""}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-800">
                                        {formatCurrency(
                                            lease.monthly_rent,
                                            lease.rent_currency || "TZS",
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {lease.fitout_applicable ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                                                <svg
                                                    className="h-3 w-3"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
                                                N/A
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {statusBadge(lease.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(() => {
                                            const actions: {
                                                label: string;
                                                icon: string;
                                                onClick: () => void;
                                                color: string;
                                                disabled?: boolean;
                                            }[] = [];
                                            const pending =
                                                lease.status === "active"
                                                    ? getPendingAmendment(lease)
                                                    : undefined;

                                            /* View lease details — always available */
                                            actions.push({
                                                label: "View Details",
                                                icon: "M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z",
                                                onClick: () => {
                                                    router.visit(
                                                        `/manager/leases/${lease.id}`,
                                                    );
                                                    setOpenActionMenu(null);
                                                },
                                                color: "text-slate-600",
                                            });

                                            /* Lease approval actions */
                                            if (canApprove(lease)) {
                                                actions.push({
                                                    label:
                                                        approveProcessing ===
                                                        lease.id
                                                            ? "Approving..."
                                                            : "Approve Lease",
                                                    icon: "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z",
                                                    onClick: () => {
                                                        handleApprove(lease);
                                                        setOpenActionMenu(null);
                                                    },
                                                    color: "text-emerald-600",
                                                    disabled:
                                                        approveProcessing ===
                                                        lease.id,
                                                });
                                            }
                                            if (canReject(lease)) {
                                                actions.push({
                                                    label: "Reject Lease",
                                                    icon: "M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z",
                                                    onClick: () => {
                                                        setRejectingLease(
                                                            lease,
                                                        );
                                                        setRejectComment("");
                                                        setOpenActionMenu(null);
                                                    },
                                                    color: "text-rose-600",
                                                });
                                            }

                                            /* Active lease actions */
                                            if (lease.status === "active") {
                                                actions.push({
                                                    label: "Edit Lease",
                                                    icon: "M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z",
                                                    onClick: () => {
                                                        openEdit(lease);
                                                        setOpenActionMenu(null);
                                                    },
                                                    color: "text-blue-600",
                                                });
                                            }
                                            // Edit for rejected leases
                                            if (canEditRejected(lease)) {
                                                actions.push({
                                                    label: "Edit & Resubmit",
                                                    icon: "M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z",
                                                    onClick: () => {
                                                        openEdit(lease);
                                                        setOpenActionMenu(null);
                                                    },
                                                    color: "text-blue-600",
                                                });
                                            }

                                            /* Amendment actions */
                                            if (lease.status === "active") {
                                                if (
                                                    pending &&
                                                    userRole === "manager"
                                                ) {
                                                    actions.push({
                                                        label:
                                                            approveAmendProcessing ===
                                                            pending.id
                                                                ? "Approving..."
                                                                : `Approve Area (${pending.proposed_area_sqm} sqm)`,
                                                        icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
                                                        onClick: () => {
                                                            handleApproveAmendment(
                                                                pending.id,
                                                            );
                                                            setOpenActionMenu(
                                                                null,
                                                            );
                                                        },
                                                        color: "text-teal-600",
                                                        disabled:
                                                            approveAmendProcessing ===
                                                            pending.id,
                                                    });
                                                    actions.push({
                                                        label: "Reject Area Change",
                                                        icon: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z",
                                                        onClick: () => {
                                                            setRejectingAmendment(
                                                                {
                                                                    id: pending.id,
                                                                    lease,
                                                                },
                                                            );
                                                            setAmendRejectComment(
                                                                "",
                                                            );
                                                            setOpenActionMenu(
                                                                null,
                                                            );
                                                        },
                                                        color: "text-rose-600",
                                                    });
                                                } else if (
                                                    !pending &&
                                                    (userRole ===
                                                        "lease_manager" ||
                                                        userRole === "manager")
                                                ) {
                                                    actions.push({
                                                        label: "Change Area",
                                                        icon: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 16.25v-4.5m0 4.5h4.5m-4.5 0L9 11M16.25 3.75h-4.5m4.5 0v4.5m0-4.5L11 9M16.25 16.25h-4.5m4.5 0v-4.5m0 4.5L11 11",
                                                        onClick: () => {
                                                            openAmendment(
                                                                lease,
                                                            );
                                                            setOpenActionMenu(
                                                                null,
                                                            );
                                                        },
                                                        color: "text-indigo-600",
                                                    });
                                                } else if (pending) {
                                                    actions.push({
                                                        label: "Area Change Pending",
                                                        icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z",
                                                        onClick: () => {},
                                                        color: "text-orange-500",
                                                    });
                                                }
                                            }

                                            if (actions.length === 0)
                                                return null;

                                            return (
                                                <>
                                                    <button
                                                        ref={(el) => {
                                                            actionBtnRefs.current[
                                                                lease.id
                                                            ] = el;
                                                        }}
                                                        onClick={() =>
                                                            toggleActionMenu(
                                                                lease.id,
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                                                        </svg>
                                                    </button>
                                                    {openActionMenu ===
                                                        lease.id &&
                                                        createPortal(
                                                            <div
                                                                ref={
                                                                    actionMenuRef
                                                                }
                                                                className="fixed z-[9999] w-56 rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-slate-200/60"
                                                                style={{
                                                                    top: menuPos.openUp
                                                                        ? undefined
                                                                        : menuPos.top,
                                                                    bottom: menuPos.openUp
                                                                        ? window.innerHeight -
                                                                          menuPos.top +
                                                                          4
                                                                        : undefined,
                                                                    left: menuPos.left,
                                                                }}
                                                            >
                                                                {actions.map(
                                                                    (
                                                                        action,
                                                                        i,
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                i
                                                                            }
                                                                            onClick={
                                                                                action.onClick
                                                                            }
                                                                            disabled={
                                                                                action.disabled
                                                                            }
                                                                            className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50 ${action.color}`}
                                                                        >
                                                                            <svg
                                                                                className="h-4 w-4 shrink-0"
                                                                                viewBox="0 0 20 20"
                                                                                fill="currentColor"
                                                                            >
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d={
                                                                                        action.icon
                                                                                    }
                                                                                    clipRule="evenodd"
                                                                                />
                                                                            </svg>
                                                                            {
                                                                                action.label
                                                                            }
                                                                        </button>
                                                                    ),
                                                                )}
                                                            </div>,
                                                            document.body,
                                                        )}
                                                </>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {leases.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1">
                    {leases.links.map((link, i) => (
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

            {/* Create Lease Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
                        {/* Fixed Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">
                                New Lease Agreement
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Create a new lease for {building.name}
                            </p>
                        </div>

                        <form
                            onSubmit={handleCreate}
                            className="flex flex-col flex-1 overflow-hidden"
                        >
                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {/* Unit */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Unit
                                    </label>
                                    <select
                                        value={createForm.data.unit_id}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "unit_id",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="">Select unit</option>
                                        {vacantUnits.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.unit_number}
                                                {u.floor
                                                    ? ` (${u.floor})`
                                                    : ""}{" "}
                                                — {u.area_sqm} sqm ×{" "}
                                                {formatCurrency(
                                                    u.rent_amount,
                                                    u.rent_currency,
                                                )}
                                                /sqm
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.unit_id && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {createForm.errors.unit_id}
                                        </p>
                                    )}
                                </div>

                                {/* Auto-calculated monthly rent */}
                                {selectedUnit && (
                                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                                    Monthly Rent
                                                    (auto-calculated)
                                                </p>
                                                <p className="text-xs text-blue-500 mt-0.5">
                                                    {selectedUnit.area_sqm} sqm
                                                    &times;{" "}
                                                    {formatCurrency(
                                                        selectedUnit.rent_amount,
                                                        rentCurrency,
                                                    )}
                                                    /sqm
                                                </p>
                                            </div>
                                            <p className="text-xl font-bold text-blue-700">
                                                {formatCurrency(
                                                    calculatedRent,
                                                    rentCurrency,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Deposit Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Deposit Amount
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={createForm.data.deposit_amount}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "deposit_amount",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                    />
                                    {createForm.errors.deposit_amount && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {createForm.errors.deposit_amount}
                                        </p>
                                    )}
                                </div>

                                {/* Tenant — dropdown to pick mode */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tenant
                                    </label>
                                    <select
                                        value={tenantMode}
                                        onChange={(e) => {
                                            const mode = e.target.value as
                                                | "existing"
                                                | "new";
                                            setTenantMode(mode);
                                            if (mode === "existing") {
                                                createForm.setData(
                                                    "tenant_name",
                                                    "",
                                                );
                                                createForm.setData(
                                                    "tenant_email",
                                                    "",
                                                );
                                                createForm.setData(
                                                    "tenant_phone",
                                                    "",
                                                );
                                            } else {
                                                createForm.setData(
                                                    "tenant_id",
                                                    "",
                                                );
                                            }
                                        }}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition mb-3"
                                    >
                                        <option value="existing">
                                            Existing Tenant
                                        </option>
                                        <option value="new">New Tenant</option>
                                    </select>

                                    {tenantMode === "existing" ? (
                                        <select
                                            value={createForm.data.tenant_id}
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "tenant_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                        >
                                            <option value="">
                                                Select tenant
                                            </option>
                                            {existingTenants.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.full_name}
                                                    {t.phone
                                                        ? ` (${t.phone})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={
                                                    createForm.data.tenant_name
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        "tenant_name",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Full name"
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                            />
                                            <input
                                                type="email"
                                                value={
                                                    createForm.data.tenant_email
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        "tenant_email",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Email (optional)"
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                            />
                                            <input
                                                type="text"
                                                value={
                                                    createForm.data.tenant_phone
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        "tenant_phone",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Phone (optional)"
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                            />
                                        </div>
                                    )}
                                    {(createForm.errors.tenant_id ||
                                        createForm.errors.tenant_name) && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {createForm.errors.tenant_id ||
                                                createForm.errors.tenant_name}
                                        </p>
                                    )}
                                </div>

                                {/* Rental Period */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Rental Period
                                    </label>
                                    <select
                                        value={
                                            createForm.data.rental_period_years
                                        }
                                        onChange={(e) =>
                                            handleRentalPeriodChange(
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="">Select period</option>
                                        {RENTAL_PERIODS.map((y) => (
                                            <option key={y} value={y}>
                                                {y} {y === 1 ? "Year" : "Years"}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.rental_period_years && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {
                                                createForm.errors
                                                    .rental_period_years
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Billing Cycle */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Billing Cycle
                                    </label>
                                    <select
                                        value={
                                            createForm.data.billing_cycle_months
                                        }
                                        onChange={(e) =>
                                            createForm.setData(
                                                "billing_cycle_months",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="3">
                                            Quarterly (3 months)
                                        </option>
                                        <option value="4">
                                            Every 4 months
                                        </option>
                                        <option value="6">
                                            Semi-Annual (6 months)
                                        </option>
                                        <option value="12">
                                            Annual (12 months)
                                        </option>
                                    </select>
                                    {createForm.errors.billing_cycle_months && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {
                                                createForm.errors
                                                    .billing_cycle_months
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.data.start_date}
                                            onChange={(e) =>
                                                handleStartDateChange(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                        />
                                        {createForm.errors.start_date && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {createForm.errors.start_date}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            End Date
                                            {createForm.data
                                                .rental_period_years && (
                                                <span className="ml-1 text-xs font-normal text-slate-400">
                                                    (auto)
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.data.end_date}
                                            readOnly={
                                                !!createForm.data
                                                    .rental_period_years
                                            }
                                            onChange={(e) =>
                                                createForm.setData(
                                                    "end_date",
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition ${
                                                createForm.data
                                                    .rental_period_years
                                                    ? "bg-slate-50 text-slate-500"
                                                    : ""
                                            }`}
                                        />
                                        {createForm.errors.end_date && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {createForm.errors.end_date}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Fit-out — dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Fit-out
                                    </label>
                                    <select
                                        value={
                                            createForm.data.fitout_applicable
                                                ? "yes"
                                                : "no"
                                        }
                                        onChange={(e) => {
                                            const applicable =
                                                e.target.value === "yes";
                                            createForm.setData(
                                                "fitout_applicable",
                                                applicable,
                                            );
                                            if (!applicable) {
                                                createForm.setData(
                                                    "fitout_start_date",
                                                    "",
                                                );
                                                createForm.setData(
                                                    "fitout_end_date",
                                                    "",
                                                );
                                            }
                                        }}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    >
                                        <option value="no">
                                            Not Applicable
                                        </option>
                                        <option value="yes">Applicable</option>
                                    </select>
                                    {createForm.errors.fitout_applicable && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {
                                                createForm.errors
                                                    .fitout_applicable
                                            }
                                        </p>
                                    )}

                                    {createForm.data.fitout_applicable && (
                                        <div className="grid grid-cols-2 gap-4 mt-3 rounded-xl border border-violet-100 bg-violet-50/30 p-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                                    Fit-out Start
                                                </label>
                                                <input
                                                    type="date"
                                                    value={
                                                        createForm.data
                                                            .fitout_start_date
                                                    }
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            "fitout_start_date",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                />
                                                {createForm.errors
                                                    .fitout_start_date && (
                                                    <p className="mt-1 text-xs text-red-500">
                                                        {
                                                            createForm.errors
                                                                .fitout_start_date
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                                    Fit-out End
                                                </label>
                                                <input
                                                    type="date"
                                                    value={
                                                        createForm.data
                                                            .fitout_end_date
                                                    }
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            "fitout_end_date",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                />
                                                {createForm.errors
                                                    .fitout_end_date && (
                                                    <p className="mt-1 text-xs text-red-500">
                                                        {
                                                            createForm.errors
                                                                .fitout_end_date
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fixed Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                                    className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50"
                                >
                                    {createForm.processing
                                        ? "Creating..."
                                        : "Create Lease"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Lease Modal */}
            {showEditModal && editingLease && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => {
                            setShowEditModal(false);
                            setEditingLease(null);
                        }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Edit Lease
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">
                            {editingLease.tenant.full_name} &middot; Unit{" "}
                            {editingLease.unit.unit_number}
                        </p>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Monthly Rent (
                                    {editingLease.rent_currency || "TZS"})
                                </label>
                                <input
                                    type="number"
                                    value={editForm.data.monthly_rent}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "monthly_rent",
                                            e.target.value,
                                        )
                                    }
                                    min="0"
                                    step="1000"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                                {editForm.errors.monthly_rent && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {editForm.errors.monthly_rent}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={editForm.data.end_date}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "end_date",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={editForm.data.status}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "status",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                >
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="terminated">
                                        Terminated
                                    </option>
                                </select>
                                {editForm.errors.status && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {editForm.errors.status}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingLease(null);
                                    }}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50"
                                >
                                    {editForm.processing
                                        ? "Saving..."
                                        : "Update Lease"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approve Lease Modal */}
            {approvingLease && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => {
                            setApprovingLease(null);
                            setApproveComment("");
                        }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Approve Lease
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {approvingLease.tenant.full_name} &middot; Unit{" "}
                            {approvingLease.unit.unit_number}
                        </p>
                        <form
                            onSubmit={handleApproveSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Feedback (optional)
                                </label>
                                <textarea
                                    value={approveComment}
                                    onChange={(e) =>
                                        setApproveComment(e.target.value)
                                    }
                                    rows={2}
                                    placeholder="You may provide feedback..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setApprovingLease(null);
                                        setApproveComment("");
                                    }}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        approveProcessing ===
                                        (approvingLease?.id ?? null)
                                    }
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 disabled:opacity-50"
                                >
                                    {approveProcessing ===
                                    (approvingLease?.id ?? null)
                                        ? "Approving..."
                                        : "Approve Lease"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Lease Modal */}
            {rejectingLease && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => {
                            setRejectingLease(null);
                            setRejectComment("");
                        }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Reject Lease
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {rejectingLease.tenant.full_name} &middot; Unit{" "}
                            {rejectingLease.unit.unit_number}
                        </p>
                        <form onSubmit={handleReject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Reason for rejection{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={rejectComment}
                                    onChange={(e) =>
                                        setRejectComment(e.target.value)
                                    }
                                    rows={3}
                                    required
                                    placeholder="Please provide a reason..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRejectingLease(null);
                                        setRejectComment("");
                                    }}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        rejectProcessing ||
                                        !rejectComment.trim()
                                    }
                                    className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:shadow-rose-500/40 disabled:opacity-50"
                                >
                                    {rejectProcessing
                                        ? "Rejecting..."
                                        : "Reject Lease"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Area Change Modal */}
            {amendingLease && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setAmendingLease(null)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Request Area Change
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {amendingLease.tenant.full_name} &middot; Unit{" "}
                            {amendingLease.unit.unit_number}
                        </p>

                        {/* Current info */}
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">
                                    Current Area
                                </span>
                                <span className="font-medium text-slate-700">
                                    {amendingLease.unit.area_sqm} sqm
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-500">
                                    Current Rent
                                </span>
                                <span className="font-medium text-slate-700">
                                    {formatCurrency(
                                        amendingLease.monthly_rent,
                                        amendingLease.rent_currency || "TZS",
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-500">Rate</span>
                                <span className="font-medium text-slate-700">
                                    {formatCurrency(
                                        amendingLease.unit.rent_amount,
                                        amendingLease.unit.rent_currency ||
                                            "TZS",
                                    )}
                                    /sqm
                                </span>
                            </div>
                        </div>

                        <form
                            onSubmit={handleAmendmentRequest}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    New Area (sqm)
                                </label>
                                <input
                                    type="number"
                                    value={amendArea}
                                    onChange={(e) =>
                                        setAmendArea(e.target.value)
                                    }
                                    min="0.01"
                                    step="0.01"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                />
                            </div>

                            {/* Proposed rent preview */}
                            {amendArea && parseFloat(amendArea) > 0 && (
                                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                                                New Monthly Rent
                                            </p>
                                            <p className="text-xs text-indigo-500 mt-0.5">
                                                {amendArea} sqm &times;{" "}
                                                {formatCurrency(
                                                    amendingLease.unit
                                                        .rent_amount,
                                                    amendingLease.unit
                                                        .rent_currency || "TZS",
                                                )}
                                                /sqm
                                            </p>
                                        </div>
                                        <p className="text-xl font-bold text-indigo-700">
                                            {formatCurrency(
                                                amendCalculatedRent,
                                                amendingLease.unit
                                                    .rent_currency || "TZS",
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Reason (optional)
                                </label>
                                <textarea
                                    value={amendReason}
                                    onChange={(e) =>
                                        setAmendReason(e.target.value)
                                    }
                                    rows={2}
                                    placeholder="Tenant requested additional space..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAmendingLease(null)}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        amendProcessing ||
                                        !amendArea ||
                                        parseFloat(amendArea) <= 0 ||
                                        parseFloat(amendArea) ===
                                            amendingLease.unit.area_sqm
                                    }
                                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:opacity-50"
                                >
                                    {amendProcessing
                                        ? "Submitting..."
                                        : "Submit for Approval"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Amendment Modal */}
            {rejectingAmendment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => {
                            setRejectingAmendment(null);
                            setAmendRejectComment("");
                        }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Reject Area Change
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {rejectingAmendment.lease.tenant.full_name} &middot;
                            Unit {rejectingAmendment.lease.unit.unit_number}
                        </p>
                        <form
                            onSubmit={handleRejectAmendment}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Reason for rejection
                                </label>
                                <textarea
                                    value={amendRejectComment}
                                    onChange={(e) =>
                                        setAmendRejectComment(e.target.value)
                                    }
                                    rows={3}
                                    required
                                    placeholder="Please provide a reason..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRejectingAmendment(null);
                                        setAmendRejectComment("");
                                    }}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        amendRejectProcessing ||
                                        !amendRejectComment.trim()
                                    }
                                    className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:shadow-rose-500/40 disabled:opacity-50"
                                >
                                    {amendRejectProcessing
                                        ? "Rejecting..."
                                        : "Reject Change"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
