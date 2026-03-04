import React from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";

export default function Permissions({ title, user, building }: any) {
    return (
        <ManagerLayout
            title={title}
            activeNav="permissions"
            user={user}
            building={building}
        >
            <div className="flex flex-col items-center justify-center h-96">
                <h1 className="text-3xl font-bold mb-4">Coming Soon</h1>
                <p className="text-slate-500">
                    This feature is under construction and will be available in
                    a future update.
                </p>
            </div>
        </ManagerLayout>
    );
}
