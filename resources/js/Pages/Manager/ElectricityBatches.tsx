import React, { useMemo, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import ElectricityTabs from "@/Pages/Manager/components/ElectricityTabs";

interface BatchReading {
    id: number;
    unit_id: number;
    tenant_id: number | null;
    opening_kwh: number;
    closing_kwh: number;
    usage_kwh: number;
    reading_date: string;
    is_estimated: boolean;
    estimation_reason: string | null;
    exception_flag: boolean;
    exception_note: string | null;
}

interface Batch {
    id: number;
    period_month: string;
    issue_date: string;
    due_date: string;
    grid_kwh: number;
    grid_cost: number;
    generator_kwh: number;
    generator_cost: number;
    source_kwh: number;
    source_cost: number;
    blend_rate: number;
    loss_threshold_percent: number;
    reconciliation_status: "ok" | "warning" | "blocked";
    tenant_usage_kwh: number;
    loss_percent: number;
    readings_count: number;
    approved_at: string | null;
    approved_by: string | null;
    created_by: string | null;
    notes: string | null;
    readings: BatchReading[];
}

interface ActiveLease {
    id: number;
    tenant_id: number;
    unit_id: number;
    tenant: string;
    unit: string;
    currency: string;
}

interface PaginatedBatches {
    data: Batch[];
    current_page: number;
    last_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    title?: string;
    user: { name: string; email: string; role?: string };
    building: { id: number; name: string; address: string };
    batches: PaginatedBatches;
    activeLeases: ActiveLease[];
}

interface ReadingDraft {
    lease_id: number;
    opening_kwh: string;
    closing_kwh: string;
    reading_date: string;
    is_estimated: boolean;
    estimation_reason: string;
    exception_note: string;
}

function statusPill(status: Batch["reconciliation_status"]) {
    if (status === "ok") {
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    if (status === "warning") {
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
    return "bg-red-50 text-red-700 border-red-100";
}

function formatCurrency(amount: number, currency = "TZS") {
    return new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function ElectricityBatches({
    title = "Electricity Billing",
    user,
    building,
    batches,
    activeLeases,
}: Props) {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const createBatchForm = useForm({
        period_month: currentMonth,
        issue_date: today,
        due_date: today,
        grid_kwh: "",
        grid_cost: "",
        generator_kwh: "",
        generator_cost: "",
        loss_threshold_percent: "5",
        notes: "",
    });

    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(
        batches.data[0]?.id ?? null,
    );
    const [activeTab, setActiveTab] = useState<
        "batches" | "readings" | "review"
    >("batches");
    const [readingRows, setReadingRows] = useState<ReadingDraft[]>([]);

    const selectedBatch = useMemo(
        () =>
            batches.data.find((batch) => batch.id === selectedBatchId) ?? null,
        [batches.data, selectedBatchId],
    );

    const batchStats = useMemo(() => {
        const sourceCost = batches.data.reduce(
            (sum, batch) => sum + batch.source_cost,
            0,
        );
        const tenantUsage = batches.data.reduce(
            (sum, batch) => sum + batch.tenant_usage_kwh,
            0,
        );
        const blockedCount = batches.data.filter(
            (batch) => batch.reconciliation_status === "blocked",
        ).length;

        return {
            sourceCost,
            tenantUsage,
            blockedCount,
        };
    }, [batches.data]);

    function seedReadingRows(batch: Batch | null) {
        if (!batch) {
            setReadingRows([]);
            return;
        }

        const nextRows = activeLeases.map((lease) => {
            const existing = batch.readings.find(
                (reading) => reading.unit_id === lease.unit_id,
            );
            return {
                lease_id: lease.id,
                opening_kwh: existing ? String(existing.opening_kwh) : "",
                closing_kwh: existing ? String(existing.closing_kwh) : "",
                reading_date: existing?.reading_date ?? batch.issue_date,
                is_estimated: existing?.is_estimated ?? false,
                estimation_reason: existing?.estimation_reason ?? "",
                exception_note: existing?.exception_note ?? "",
            };
        });

        setReadingRows(nextRows);
    }

    function selectBatch(batchId: number) {
        setSelectedBatchId(batchId);
        const batch = batches.data.find((item) => item.id === batchId) ?? null;
        seedReadingRows(batch);
    }

    function updateReadingRow(
        leaseId: number,
        field: keyof ReadingDraft,
        value: string | boolean,
    ) {
        setReadingRows((prev) =>
            prev.map((row) =>
                row.lease_id === leaseId ? { ...row, [field]: value } : row,
            ),
        );
    }

    function submitBatch() {
        createBatchForm.post("/manager/electricity/batches", {
            preserveScroll: true,
            onSuccess: () => {
                createBatchForm.reset();
                createBatchForm.setData((data) => ({
                    ...data,
                    period_month: currentMonth,
                    issue_date: today,
                    due_date: today,
                    loss_threshold_percent: "5",
                }));
            },
        });
    }

    function submitReadings() {
        if (!selectedBatch) return;

        const payload = readingRows
            .filter((row) => row.opening_kwh !== "" && row.closing_kwh !== "")
            .map((row) => ({
                lease_id: row.lease_id,
                opening_kwh: Number(row.opening_kwh),
                closing_kwh: Number(row.closing_kwh),
                reading_date: row.reading_date || selectedBatch.issue_date,
                is_estimated: row.is_estimated,
                estimation_reason: row.estimation_reason || undefined,
                exception_note: row.exception_note || undefined,
            }));

        router.post(
            `/manager/electricity/batches/${selectedBatch.id}/readings`,
            { readings: payload },
            { preserveScroll: true },
        );
    }

    function calculateBatch(batchId: number) {
        router.post(
            `/manager/electricity/batches/${batchId}/calculate`,
            {},
            { preserveScroll: true },
        );
    }

    function approveAndPost(batch: Batch) {
        const mustProvideNote = batch.reconciliation_status === "warning";
        const note = mustProvideNote
            ? window.prompt(
                  "This batch has WARNING reconciliation. Add a manager review note before posting:",
                  "Verified and approved for posting.",
              )
            : "";

        if (mustProvideNote && !note) {
            return;
        }

        router.post(
            `/manager/electricity/batches/${batch.id}/approve`,
            {
                document_type: "invoice",
                review_note: note || undefined,
            },
            { preserveScroll: true },
        );
    }

    function handleTabChange(tab: "batches" | "readings" | "review") {
        setActiveTab(tab);

        if (
            (tab === "readings" || tab === "review") &&
            !selectedBatchId &&
            batches.data.length > 0
        ) {
            selectBatch(batches.data[0].id);
        }
    }

    React.useEffect(() => {
        if (!selectedBatchId && batches.data.length > 0) {
            selectBatch(batches.data[0].id);
            return;
        }

        if (selectedBatch) {
            seedReadingRows(selectedBatch);
        }
    }, [batches.data.length]);

    return (
        <ManagerLayout
            title={title}
            activeNav="electricity"
            user={user}
            building={building}
        >
            <div className="mb-4">
                <ElectricityTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
            </div>

            {activeTab === "batches" && (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Batches (Page)
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-800">
                                {batches.data.length}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Source Cost
                            </p>
                            <p className="mt-2 text-2xl font-bold text-blue-700">
                                {formatCurrency(batchStats.sourceCost)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Tenant Usage (kWh)
                            </p>
                            <p className="mt-2 text-2xl font-bold text-emerald-700">
                                {batchStats.tenantUsage.toLocaleString(
                                    undefined,
                                    {
                                        maximumFractionDigits: 2,
                                    },
                                )}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Blocked Batches
                            </p>
                            <p className="mt-2 text-2xl font-bold text-red-700">
                                {batchStats.blockedCount}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-1">
                            <h2 className="text-base font-semibold text-slate-800">
                                Create Monthly Batch
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Define source totals before capturing meter
                                readings.
                            </p>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">
                                        Period Month
                                    </label>
                                    <input
                                        type="month"
                                        value={
                                            createBatchForm.data.period_month
                                        }
                                        onChange={(event) =>
                                            createBatchForm.setData(
                                                "period_month",
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Issue Date
                                        </label>
                                        <input
                                            type="date"
                                            value={
                                                createBatchForm.data.issue_date
                                            }
                                            onChange={(event) =>
                                                createBatchForm.setData(
                                                    "issue_date",
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={
                                                createBatchForm.data.due_date
                                            }
                                            onChange={(event) =>
                                                createBatchForm.setData(
                                                    "due_date",
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Grid kWh
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                createBatchForm.data.grid_kwh
                                            }
                                            onChange={(event) =>
                                                createBatchForm.setData(
                                                    "grid_kwh",
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Grid Cost
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                createBatchForm.data.grid_cost
                                            }
                                            onChange={(event) =>
                                                createBatchForm.setData(
                                                    "grid_cost",
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Generator kWh
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                createBatchForm.data
                                                    .generator_kwh
                                            }
                                            onChange={(event) =>
                                                createBatchForm.setData(
                                                    "generator_kwh",
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-500">
                                            Generator Cost
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                createBatchForm.data
                                                    .generator_cost
                                            }
                                            onChange={(event) =>
                                                createBatchForm.setData(
                                                    "generator_cost",
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">
                                        Loss Threshold %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={
                                            createBatchForm.data
                                                .loss_threshold_percent
                                        }
                                        onChange={(event) =>
                                            createBatchForm.setData(
                                                "loss_threshold_percent",
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">
                                        Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={createBatchForm.data.notes}
                                        onChange={(event) =>
                                            createBatchForm.setData(
                                                "notes",
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={submitBatch}
                                    disabled={createBatchForm.processing}
                                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {createBatchForm.processing
                                        ? "Saving..."
                                        : "Create Batch"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-2">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-base font-semibold text-slate-800">
                                    Batches
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <th className="px-4 py-3">Month</th>
                                            <th className="px-4 py-3">
                                                Readings
                                            </th>
                                            <th className="px-4 py-3">
                                                Blend Rate
                                            </th>
                                            <th className="px-4 py-3">Loss</th>
                                            <th className="px-4 py-3">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {batches.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-12 text-center text-slate-400"
                                                >
                                                    No electricity batches yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            batches.data.map((batch) => (
                                                <tr
                                                    key={batch.id}
                                                    className={
                                                        selectedBatchId ===
                                                        batch.id
                                                            ? "bg-blue-50/40"
                                                            : ""
                                                    }
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-slate-800">
                                                            {batch.period_month}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            Due {batch.due_date}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {batch.readings_count}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {batch.blend_rate.toFixed(
                                                            4,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {batch.loss_percent.toFixed(
                                                            2,
                                                        )}
                                                        %
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusPill(batch.reconciliation_status)}`}
                                                        >
                                                            {batch.reconciliation_status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    selectBatch(
                                                                        batch.id,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                            >
                                                                Inline Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    calculateBatch(
                                                                        batch.id,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                                            >
                                                                Calculate
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    approveAndPost(
                                                                        batch,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !!batch.approved_at ||
                                                                    batch.readings_count ===
                                                                        0
                                                                }
                                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                            >
                                                                {batch.approved_at
                                                                    ? "Posted"
                                                                    : "Approve & Post"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {batches.last_page > 1 && (
                                <div className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-3">
                                    {batches.links.map((link, index) => (
                                        <button
                                            key={index}
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
                                                      : "cursor-not-allowed text-slate-300"
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {selectedBatch &&
                (activeTab === "readings" || activeTab === "batches") && (
                    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-800">
                                    Meter Readings -{" "}
                                    {selectedBatch.period_month}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Capture opening/closing readings for each
                                    active lease.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedBatch.id}
                                    onChange={(event) =>
                                        selectBatch(Number(event.target.value))
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    {batches.data.map((batch) => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.period_month}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={submitReadings}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Save Readings
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[860px]">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <th className="px-3 py-2">
                                            Tenant / Unit
                                        </th>
                                        <th className="px-3 py-2">Opening</th>
                                        <th className="px-3 py-2">Closing</th>
                                        <th className="px-3 py-2">Usage</th>
                                        <th className="px-3 py-2">Date</th>
                                        <th className="px-3 py-2">Estimated</th>
                                        <th className="px-3 py-2">
                                            Exception Note
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {readingRows.map((row) => {
                                        const lease = activeLeases.find(
                                            (item) => item.id === row.lease_id,
                                        );
                                        const opening = Number(row.opening_kwh);
                                        const closing = Number(row.closing_kwh);
                                        const usage =
                                            Number.isFinite(opening) &&
                                            Number.isFinite(closing)
                                                ? closing - opening
                                                : 0;

                                        return (
                                            <tr key={row.lease_id}>
                                                <td className="px-3 py-2">
                                                    <p className="font-medium text-slate-800">
                                                        {lease?.tenant ?? "N/A"}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Unit{" "}
                                                        {lease?.unit ?? "-"}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={row.opening_kwh}
                                                        onChange={(event) =>
                                                            updateReadingRow(
                                                                row.lease_id,
                                                                "opening_kwh",
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="w-28 rounded-lg border border-slate-300 px-2 py-1.5"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={row.closing_kwh}
                                                        onChange={(event) =>
                                                            updateReadingRow(
                                                                row.lease_id,
                                                                "closing_kwh",
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="w-28 rounded-lg border border-slate-300 px-2 py-1.5"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 font-medium">
                                                    <span
                                                        className={
                                                            usage < 0
                                                                ? "text-red-600"
                                                                : "text-slate-700"
                                                        }
                                                    >
                                                        {Number.isFinite(usage)
                                                            ? usage.toFixed(2)
                                                            : "0.00"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="date"
                                                        value={row.reading_date}
                                                        onChange={(event) =>
                                                            updateReadingRow(
                                                                row.lease_id,
                                                                "reading_date",
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="rounded-lg border border-slate-300 px-2 py-1.5"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <label className="inline-flex items-center gap-1 text-xs">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                row.is_estimated
                                                            }
                                                            onChange={(event) =>
                                                                updateReadingRow(
                                                                    row.lease_id,
                                                                    "is_estimated",
                                                                    event.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        Yes
                                                    </label>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={
                                                            row.exception_note
                                                        }
                                                        onChange={(event) =>
                                                            updateReadingRow(
                                                                row.lease_id,
                                                                "exception_note",
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Optional note"
                                                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            {selectedBatch && activeTab === "review" && (
                <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Batch
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-800">
                                {selectedBatch.period_month}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Blend Rate
                            </p>
                            <p className="mt-2 text-2xl font-bold text-blue-700">
                                {selectedBatch.blend_rate.toFixed(4)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Loss
                            </p>
                            <p className="mt-2 text-2xl font-bold text-amber-700">
                                {selectedBatch.loss_percent.toFixed(2)}%
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Exceptions
                            </p>
                            <p className="mt-2 text-2xl font-bold text-red-700">
                                {
                                    selectedBatch.readings.filter(
                                        (reading) => reading.exception_flag,
                                    ).length
                                }
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">
                                    Review and Post Electricity Documents
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Validate reconciliation before posting
                                    tenant invoices.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedBatch.id}
                                    onChange={(event) =>
                                        selectBatch(Number(event.target.value))
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                >
                                    {batches.data.map((batch) => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.period_month}
                                        </option>
                                    ))}
                                </select>
                                <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusPill(selectedBatch.reconciliation_status)}`}
                                >
                                    {selectedBatch.reconciliation_status.toUpperCase()}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        calculateBatch(selectedBatch.id)
                                    }
                                    className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                >
                                    Recalculate
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        !(
                                            !selectedBatch.approved_at &&
                                            selectedBatch.readings_count > 0
                                        )
                                    }
                                    onClick={() =>
                                        approveAndPost(selectedBatch)
                                    }
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {selectedBatch.approved_at
                                        ? "Posted"
                                        : "Approve and Post"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full min-w-[880px]">
                                <thead>
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <th className="px-3 py-2">
                                            Reading Date
                                        </th>
                                        <th className="px-3 py-2">Opening</th>
                                        <th className="px-3 py-2">Closing</th>
                                        <th className="px-3 py-2">Usage</th>
                                        <th className="px-3 py-2">Estimated</th>
                                        <th className="px-3 py-2">Exception</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {selectedBatch.readings.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-8 text-center text-slate-400"
                                            >
                                                No readings captured for this
                                                batch.
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedBatch.readings.map(
                                            (reading) => (
                                                <tr key={reading.id}>
                                                    <td className="px-3 py-2">
                                                        {reading.reading_date}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {reading.opening_kwh.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {reading.closing_kwh.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {reading.usage_kwh.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {reading.is_estimated
                                                            ? "Yes"
                                                            : "No"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {reading.exception_flag ? (
                                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                                                {reading.exception_note ||
                                                                    "Exception flagged"}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </ManagerLayout>
    );
}
