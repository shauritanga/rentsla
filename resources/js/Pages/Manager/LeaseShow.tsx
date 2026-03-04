import React, { useState } from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import { Link, router } from "@inertiajs/react";

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
    unit_type: string | null;
    status: string;
}

interface LeaseTenant {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
}

interface ApprovalRecord {
    id: number;
    role: string;
    action: string;
    comment: string | null;
    approver_name: string | null;
    acted_at: string | null;
}

interface AmendmentRecord {
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

interface PaymentRecord {
    id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference: string | null;
    month_covered: string;
}

interface LeaseDetail {
    id: number;
    unit: LeaseUnit;
    tenant: LeaseTenant;
    start_date: string;
    end_date: string | null;
    monthly_rent: number;
    deposit_amount: number;
    rent_currency: string;
    rental_period_years: number | null;
    fitout_applicable: boolean;
    fitout_start_date: string | null;
    fitout_end_date: string | null;
    status: string;
    created_by_name: string | null;
    created_at: string;
    updated_at: string;
    approvals: ApprovalRecord[];
    amendments: AmendmentRecord[];
    payments: PaymentRecord[];
}

interface Props {
    user: { name: string; email: string };
    building: { id: number; name: string; address: string };
    lease: LeaseDetail;
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
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
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

function amendmentStatusBadge(status: string) {
    const map: Record<string, string> = {
        pending_manager: "bg-amber-50 text-amber-700",
        approved: "bg-emerald-50 text-emerald-700",
        rejected: "bg-rose-50 text-rose-700",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                map[status] || "bg-slate-100 text-slate-600"
            }`}
        >
            {status === "pending_manager" ? "Pending" : status}
        </span>
    );
}

function approvalActionBadge(action: string) {
    return action === "approved" ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                />
            </svg>
            Approved
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Rejected
        </span>
    );
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        pending_accountant: "Pending Accountant",
        pending_manager: "Pending Manager",
        active: "Active",
        expired: "Expired",
        terminated: "Terminated",
        rejected: "Rejected",
    };
    return map[status] || status;
}

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export default function LeaseShow({ user, building, lease, userRole }: Props) {
    const totalPaid = lease.payments.reduce((sum, p) => sum + p.amount, 0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    /* ---- Approval helpers ---- */
    const isPending =
        lease.status === "pending_accountant" ||
        lease.status === "pending_manager";

    const canApprove =
        (isPending && userRole === "manager") ||
        (lease.status === "pending_accountant" && userRole === "accountant");

    const canReject = canApprove;

    function handleApprove() {
        setProcessing(true);
        router.post(
            `/manager/leases/${lease.id}/approve`,
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    function handleReject() {
        setProcessing(true);
        router.post(
            `/manager/leases/${lease.id}/reject`,
            { comment: rejectComment },
            {
                onFinish: () => {
                    setProcessing(false);
                    setShowRejectModal(false);
                    setRejectComment("");
                },
            },
        );
    }

    /* ---- Approval timeline stages ---- */
    function getTimelineStages() {
        const stages: {
            key: string;
            label: string;
            description: string;
            status: "completed" | "current" | "upcoming" | "rejected";
            actor?: string;
            date?: string;
            comment?: string;
        }[] = [];

        // Stage 1: Created
        stages.push({
            key: "created",
            label: "Lease Created",
            description: `Created by ${lease.created_by_name || "Unknown"}`,
            status: "completed",
            actor: lease.created_by_name || undefined,
            date: lease.created_at,
        });

        // Determine if accountant step is part of the flow
        const hasAccountantStep =
            lease.status === "pending_accountant" ||
            lease.approvals.some((a) => a.role === "accountant");

        if (hasAccountantStep) {
            const accountantApproval = lease.approvals.find(
                (a) => a.role === "accountant",
            );

            if (accountantApproval) {
                stages.push({
                    key: "accountant",
                    label: "Accountant Review",
                    description:
                        accountantApproval.action === "approved"
                            ? `Approved by ${accountantApproval.approver_name}`
                            : `Rejected by ${accountantApproval.approver_name}`,
                    status:
                        accountantApproval.action === "approved"
                            ? "completed"
                            : "rejected",
                    actor: accountantApproval.approver_name || undefined,
                    date: accountantApproval.acted_at || undefined,
                    comment: accountantApproval.comment || undefined,
                });
            } else {
                stages.push({
                    key: "accountant",
                    label: "Accountant Review",
                    description: "Awaiting accountant review",
                    status:
                        lease.status === "pending_accountant"
                            ? "current"
                            : "upcoming",
                });
            }
        }

        // Stage: Manager approval
        const managerApproval = lease.approvals.find(
            (a) => a.role === "manager",
        );
        if (managerApproval) {
            stages.push({
                key: "manager",
                label: "Manager Approval",
                description:
                    managerApproval.action === "approved"
                        ? `Approved by ${managerApproval.approver_name}`
                        : `Rejected by ${managerApproval.approver_name}`,
                status:
                    managerApproval.action === "approved"
                        ? "completed"
                        : "rejected",
                actor: managerApproval.approver_name || undefined,
                date: managerApproval.acted_at || undefined,
                comment: managerApproval.comment || undefined,
            });
        } else if (lease.status !== "active" || hasAccountantStep) {
            // Only show manager step if lease went through approval flow
            const isManagerCreated =
                !hasAccountantStep &&
                lease.status === "active" &&
                !lease.approvals.length;
            if (!isManagerCreated) {
                stages.push({
                    key: "manager",
                    label: "Manager Approval",
                    description: "Awaiting manager approval",
                    status:
                        lease.status === "pending_manager"
                            ? "current"
                            : "upcoming",
                });
            }
        }

        // Final stage: Active / Rejected
        if (lease.status === "active") {
            stages.push({
                key: "active",
                label: "Lease Active",
                description: "Lease is now active",
                status: "completed",
            });
        } else if (lease.status === "rejected") {
            stages.push({
                key: "rejected",
                label: "Lease Rejected",
                description: "This lease was rejected",
                status: "rejected",
            });
        } else {
            stages.push({
                key: "active",
                label: "Lease Activation",
                description: "Will activate after all approvals",
                status: "upcoming",
            });
        }

        return stages;
    }

    const timelineStages = getTimelineStages();

    return (
        <ManagerLayout
            title={`Lease #${lease.id}`}
            activeNav="leases"
            user={user}
            building={building}
        >
            {/* Breadcrumb + Action Buttons */}
            <div className="mb-6 flex items-center justify-between">
                <nav className="flex items-center gap-2 text-sm text-slate-500">
                    <Link
                        href="/manager/leases"
                        className="text-blue-600 hover:text-blue-700 transition font-medium"
                    >
                        Leases
                    </Link>
                    <svg
                        className="h-4 w-4 text-slate-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span className="text-slate-700 font-medium">
                        Unit {lease.unit.unit_number} — {lease.tenant.full_name}
                    </span>
                </nav>

                <div className="flex items-center gap-2">
                    {/* Approval Button */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition"
                    >
                        <svg
                            className="h-4 w-4 text-amber-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Approval
                    </button>

                    {/* Actions Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setActionsOpen(!actionsOpen)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition"
                        >
                            Actions
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        {actionsOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActionsOpen(false)}
                                />
                                <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200/60">
                                    {canApprove && (
                                        <button
                                            onClick={() => {
                                                handleApprove();
                                                setActionsOpen(false);
                                            }}
                                            disabled={processing}
                                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50"
                                        >
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
                                            {processing
                                                ? "Approving…"
                                                : "Approve Lease"}
                                        </button>
                                    )}
                                    {canReject && (
                                        <button
                                            onClick={() => {
                                                setShowRejectModal(true);
                                                setActionsOpen(false);
                                            }}
                                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50 transition"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                            </svg>
                                            Reject Lease
                                        </button>
                                    )}
                                    {lease.status === "active" && (
                                        <button
                                            onClick={() => {
                                                router.visit(`/manager/leases`);
                                                setActionsOpen(false);
                                            }}
                                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                                            </svg>
                                            Edit Lease
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            window.print();
                                            setActionsOpen(false);
                                        }}
                                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.75v3.25c0 .966-.784 1.75-1.75 1.75h-6.5A1.75 1.75 0 015 18.25V15h-.75A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.749-.107 1.126-.153V2.75zm1.5 0v3.36a41.778 41.778 0 017 0V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25zm0 9.5v6h7v-6h-7z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Print
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Header Card */}
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                Lease #{lease.id}
                            </h1>
                            {statusBadge(lease.status)}
                        </div>
                        <p className="text-sm text-slate-500">
                            Created by {lease.created_by_name || "—"} on{" "}
                            {lease.created_at}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Monthly Rent</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(
                                lease.monthly_rent,
                                lease.rent_currency,
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Lease Details */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <svg
                            className="h-5 w-5 text-blue-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Lease Details
                    </h2>
                    <dl className="space-y-3">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <dt className="text-sm text-slate-500">
                                Start Date
                            </dt>
                            <dd className="text-sm font-medium text-slate-900">
                                {lease.start_date}
                            </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <dt className="text-sm text-slate-500">End Date</dt>
                            <dd className="text-sm font-medium text-slate-900">
                                {lease.end_date || "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <dt className="text-sm text-slate-500">
                                Rental Period
                            </dt>
                            <dd className="text-sm font-medium text-slate-900">
                                {lease.rental_period_years
                                    ? `${lease.rental_period_years} year${lease.rental_period_years > 1 ? "s" : ""}`
                                    : "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <dt className="text-sm text-slate-500">
                                Monthly Rent
                            </dt>
                            <dd className="text-sm font-medium text-slate-900">
                                {formatCurrency(
                                    lease.monthly_rent,
                                    lease.rent_currency,
                                )}
                            </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <dt className="text-sm text-slate-500">
                                Deposit Amount
                            </dt>
                            <dd className="text-sm font-medium text-slate-900">
                                {formatCurrency(
                                    lease.deposit_amount,
                                    lease.rent_currency,
                                )}
                            </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <dt className="text-sm text-slate-500">Fit-out</dt>
                            <dd className="text-sm font-medium text-slate-900">
                                {lease.fitout_applicable ? "Yes" : "No"}
                            </dd>
                        </div>
                        {lease.fitout_applicable && (
                            <>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <dt className="text-sm text-slate-500">
                                        Fit-out Start
                                    </dt>
                                    <dd className="text-sm font-medium text-slate-900">
                                        {lease.fitout_start_date || "—"}
                                    </dd>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <dt className="text-sm text-slate-500">
                                        Fit-out End
                                    </dt>
                                    <dd className="text-sm font-medium text-slate-900">
                                        {lease.fitout_end_date || "—"}
                                    </dd>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between">
                            <dt className="text-sm text-slate-500">
                                Last Updated
                            </dt>
                            <dd className="text-sm font-medium text-slate-900">
                                {lease.updated_at}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Unit & Tenant Info */}
                <div className="space-y-6">
                    {/* Unit Card */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-indigo-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M4 3a2 2 0 00-2 2v11.5A1.5 1.5 0 003.5 18h13A1.5 1.5 0 0018 16.5V5a2 2 0 00-2-2H4zm0 2h12v3H4V5zm0 5h5v6H4v-6zm7 0h5v6h-5v-6z" />
                            </svg>
                            Unit Information
                        </h2>
                        <dl className="space-y-3">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <dt className="text-sm text-slate-500">
                                    Unit Number
                                </dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {lease.unit.unit_number}
                                </dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <dt className="text-sm text-slate-500">
                                    Floor
                                </dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {lease.unit.floor || "—"}
                                </dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <dt className="text-sm text-slate-500">Area</dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {lease.unit.area_sqm} sqm
                                </dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <dt className="text-sm text-slate-500">
                                    Rate / sqm
                                </dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {formatCurrency(
                                        lease.unit.rent_amount,
                                        lease.unit.rent_currency,
                                    )}
                                </dd>
                            </div>
                            {lease.unit.unit_type && (
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <dt className="text-sm text-slate-500">
                                        Type
                                    </dt>
                                    <dd className="text-sm font-medium text-slate-900 capitalize">
                                        {lease.unit.unit_type}
                                    </dd>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <dt className="text-sm text-slate-500">
                                    Status
                                </dt>
                                <dd>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                            lease.unit.status === "occupied"
                                                ? "bg-blue-50 text-blue-700"
                                                : "bg-emerald-50 text-emerald-700"
                                        }`}
                                    >
                                        {lease.unit.status}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Tenant Card */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <svg
                                className="h-5 w-5 text-teal-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                            </svg>
                            Tenant Information
                        </h2>
                        <dl className="space-y-3">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <dt className="text-sm text-slate-500">Name</dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {lease.tenant.full_name}
                                </dd>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <dt className="text-sm text-slate-500">
                                    Email
                                </dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {lease.tenant.email ? (
                                        <a
                                            href={`mailto:${lease.tenant.email}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {lease.tenant.email}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-sm text-slate-500">
                                    Phone
                                </dt>
                                <dd className="text-sm font-medium text-slate-900">
                                    {lease.tenant.phone ? (
                                        <a
                                            href={`tel:${lease.tenant.phone}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {lease.tenant.phone}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            {lease.payments.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20">
                        <p className="text-sm font-medium text-emerald-100">
                            Total Paid
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                            {formatCurrency(totalPaid, lease.rent_currency)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/20">
                        <p className="text-sm font-medium text-blue-100">
                            Monthly Rent
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                            {formatCurrency(
                                lease.monthly_rent,
                                lease.rent_currency,
                            )}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 p-5 text-white shadow-lg shadow-slate-500/20">
                        <p className="text-sm font-medium text-slate-300">
                            Payments Made
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                            {lease.payments.length}
                        </p>
                    </div>
                </div>
            )}

            {/* Approval History */}
            {lease.approvals.length > 0 && (
                <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <svg
                            className="h-5 w-5 text-amber-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Approval History
                    </h2>
                    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200/60">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Action
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        By
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Comment
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lease.approvals.map((a) => (
                                    <tr
                                        key={a.id}
                                        className="hover:bg-slate-50/50"
                                    >
                                        <td className="px-4 py-3 text-sm font-medium text-slate-700 capitalize">
                                            {a.role}
                                        </td>
                                        <td className="px-4 py-3">
                                            {approvalActionBadge(a.action)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {a.approver_name || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                                            {a.comment || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {a.acted_at || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Amendment History */}
            {lease.amendments.length > 0 && (
                <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <svg
                            className="h-5 w-5 text-indigo-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 16.25v-4.5m0 4.5h4.5m-4.5 0L9 11M16.25 3.75h-4.5m4.5 0v4.5m0-4.5L11 9M16.25 16.25h-4.5m4.5 0v-4.5m0 4.5L11 11" />
                        </svg>
                        Area Change History
                    </h2>
                    <div className="space-y-4">
                        {lease.amendments.map((am) => (
                            <div
                                key={am.id}
                                className={`rounded-xl p-4 ring-1 ${
                                    am.status === "approved"
                                        ? "bg-emerald-50/50 ring-emerald-200"
                                        : am.status === "rejected"
                                          ? "bg-rose-50/50 ring-rose-200"
                                          : "bg-amber-50/50 ring-amber-200"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {amendmentStatusBadge(am.status)}
                                        <span className="text-xs text-slate-500">
                                            Requested by {am.requester_name} on{" "}
                                            {am.created_at}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-0.5">
                                            Current Area
                                        </p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {am.current_area_sqm} sqm
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Rent:{" "}
                                            {formatCurrency(
                                                am.current_monthly_rent,
                                                lease.rent_currency,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-0.5">
                                            Proposed Area
                                        </p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {am.proposed_area_sqm} sqm
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Rent:{" "}
                                            {formatCurrency(
                                                am.proposed_monthly_rent,
                                                lease.rent_currency,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {am.reason && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        <span className="font-medium">
                                            Reason:
                                        </span>{" "}
                                        {am.reason}
                                    </p>
                                )}
                                {am.reviewer_name && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Reviewed by {am.reviewer_name} on{" "}
                                        {am.reviewed_at}
                                        {am.review_comment && (
                                            <>
                                                {" "}
                                                —{" "}
                                                <span className="italic">
                                                    "{am.review_comment}"
                                                </span>
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment History */}
            {lease.payments.length > 0 && (
                <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <svg
                            className="h-5 w-5 text-emerald-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a.272.272 0 01-.35.25A49.043 49.043 0 001.75 14.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Payment History
                    </h2>
                    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200/60">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Method
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Reference
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Month
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lease.payments.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-slate-50/50"
                                    >
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {p.payment_date}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                            {formatCurrency(
                                                p.amount,
                                                lease.rent_currency,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700 capitalize">
                                            {p.payment_method}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {p.reference || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700">
                                            {p.month_covered}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty states */}
            {lease.approvals.length === 0 &&
                lease.amendments.length === 0 &&
                lease.payments.length === 0 && (
                    <div className="mt-6 rounded-2xl bg-white p-12 shadow-sm ring-1 ring-slate-200/60 text-center">
                        <svg
                            className="mx-auto h-10 w-10 text-slate-300"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p className="mt-3 text-sm text-slate-500">
                            No activity recorded for this lease yet.
                        </p>
                    </div>
                )}

            {/* ============================================================ */}
            {/*  Approval Timeline Drawer                                     */}
            {/* ============================================================ */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                        onClick={() => setDrawerOpen(false)}
                    />

                    {/* Drawer panel */}
                    <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Approval Timeline
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Lease #{lease.id} —{" "}
                                    {statusLabel(lease.status)}
                                </p>
                            </div>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
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

                        {/* Timeline */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <ol className="relative">
                                {timelineStages.map((stage, idx) => {
                                    const isLast =
                                        idx === timelineStages.length - 1;
                                    const iconColor =
                                        stage.status === "completed"
                                            ? "bg-emerald-500 text-white"
                                            : stage.status === "current"
                                              ? "bg-blue-500 text-white ring-4 ring-blue-100"
                                              : stage.status === "rejected"
                                                ? "bg-rose-500 text-white"
                                                : "bg-slate-200 text-slate-400";
                                    const lineColor =
                                        stage.status === "completed"
                                            ? "bg-emerald-300"
                                            : stage.status === "rejected"
                                              ? "bg-rose-300"
                                              : "bg-slate-200";

                                    return (
                                        <li
                                            key={stage.key}
                                            className="relative flex gap-4 pb-8 last:pb-0"
                                        >
                                            {/* Connector line */}
                                            {!isLast && (
                                                <div
                                                    className={`absolute left-[15px] top-[36px] bottom-0 w-0.5 ${lineColor}`}
                                                />
                                            )}

                                            {/* Icon */}
                                            <div
                                                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconColor}`}
                                            >
                                                {stage.status ===
                                                "completed" ? (
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
                                                ) : stage.status ===
                                                  "current" ? (
                                                    <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                                                ) : stage.status ===
                                                  "rejected" ? (
                                                    <svg
                                                        className="h-4 w-4"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                    </svg>
                                                ) : (
                                                    <span className="h-2 w-2 rounded-full bg-current" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1 pt-0.5">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {stage.label}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {stage.description}
                                                </p>
                                                {stage.date && (
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        <svg
                                                            className="h-3 w-3"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        {stage.date}
                                                    </p>
                                                )}
                                                {stage.actor &&
                                                    stage.key !== "created" && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white">
                                                                {stage.actor
                                                                    .split(" ")
                                                                    .map(
                                                                        (n) =>
                                                                            n[0],
                                                                    )
                                                                    .join("")
                                                                    .toUpperCase()
                                                                    .slice(
                                                                        0,
                                                                        2,
                                                                    )}
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {stage.actor}
                                                            </span>
                                                        </div>
                                                    )}
                                                {stage.comment && (
                                                    <div className="mt-2 rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
                                                        <p className="text-xs text-slate-600 italic">
                                                            "{stage.comment}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        {/* Footer with actions */}
                        {canApprove && (
                            <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    {processing
                                        ? "Approving…"
                                        : "Approve Lease"}
                                </button>
                                <button
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        setShowRejectModal(true);
                                    }}
                                    className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50 transition"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/*  Reject Modal                                                 */}
            {/* ============================================================ */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowRejectModal(false)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                            Reject Lease
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Please provide a reason for rejecting this lease.
                        </p>
                        <textarea
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            placeholder="Enter rejection reason…"
                            rows={4}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectComment("");
                                }}
                                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectComment.trim() || processing}
                                className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50"
                            >
                                {processing ? "Rejecting…" : "Reject Lease"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawer slide-in animation */}
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.25s ease-out;
                }
            `}</style>
        </ManagerLayout>
    );
}
