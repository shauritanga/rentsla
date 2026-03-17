import React from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";
import SettingsTabs from "@/Pages/Manager/components/SettingsTabs";

export default function Integration({ title, user, building }: any) {
    const isBuildingManager = user?.role === "Building Manager";

    return (
        <ManagerLayout
            title={title}
            activeNav="settings"
            user={user}
            building={building}
        >
            <div className="mx-auto max-w-4xl space-y-4">
                <SettingsTabs
                    activeTab="integration"
                    isBuildingManager={isBuildingManager}
                />
                <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <h1 className="mb-4 text-3xl font-bold">Coming Soon</h1>
                    <p className="text-slate-500">
                        This feature is under construction and will be available
                        in a future update.
                    </p>
                </div>
            </div>
        </ManagerLayout>
    );
}
