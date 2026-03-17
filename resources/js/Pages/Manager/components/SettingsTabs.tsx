import React from "react";
import { Link } from "@inertiajs/react";

type SettingsTabKey = "security" | "audit" | "integration";

interface SettingsTabsProps {
    activeTab: SettingsTabKey;
    isBuildingManager: boolean;
}

interface SettingsTabItem {
    key: SettingsTabKey;
    label: string;
    href: string;
}

export default function SettingsTabs({
    activeTab,
    isBuildingManager,
}: SettingsTabsProps) {
    const tabs: SettingsTabItem[] = [
        ...(isBuildingManager
            ? [
                  {
                      key: "security" as const,
                      label: "Security",
                      href: "/manager/settings",
                  },
                  {
                      key: "audit" as const,
                      label: "Audit Trail",
                      href: "/manager/audittrail",
                  },
                  {
                      key: "integration" as const,
                      label: "Integration",
                      href: "/manager/integration",
                  },
              ]
            : []),
    ];

    return (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-1.5 shadow-sm">
            <div
                className={`grid gap-1 ${isBuildingManager ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"}`}
            >
                {tabs.map((tab) => {
                    const active = activeTab === tab.key;

                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                active
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
