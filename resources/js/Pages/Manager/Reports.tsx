import React from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";

interface Props {
    title: string;
    user: { name: string; email: string; role?: string };
    building: { id: number; name: string; address: string };
}

export default function Reports({ title, user, building }: Props) {
    return (
        <ManagerLayout
            title={title}
            activeNav="reports"
            user={user}
            building={building}
        >
            <div className="p-6">
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="mt-4 text-sm text-slate-600">
                    Placeholder page — P&L, Balance Sheet, and other reports
                    will appear here.
                </p>
            </div>
        </ManagerLayout>
    );
}
