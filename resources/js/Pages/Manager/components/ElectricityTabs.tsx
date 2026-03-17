import React from "react";

type ElectricityTabKey = "batches" | "readings" | "review";

interface ElectricityTabsProps {
    activeTab: ElectricityTabKey;
    onTabChange: (tab: ElectricityTabKey) => void;
}

export default function ElectricityTabs({
    activeTab,
    onTabChange,
}: ElectricityTabsProps) {
    const tabs: Array<{ key: ElectricityTabKey; label: string }> = [
        { key: "batches", label: "Batches" },
        { key: "readings", label: "Readings" },
        { key: "review", label: "Review" },
    ];

    return (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
                {tabs.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                active
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
