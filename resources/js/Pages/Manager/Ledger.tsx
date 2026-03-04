import React from "react";
import ManagerLayout from "@/Layouts/ManagerLayout";

interface Props {
    title: string;
    user: { name: string; email: string; role?: string };
    building: { id: number; name: string; address: string };
}

export default function Ledger({ title, user, building }: Props) {
    return (
        <ManagerLayout
            title={title}
            activeNav="ledger"
            user={user}
            building={building}
        >
            <div className="p-6">
                <h1 className="text-2xl font-bold">General Ledger</h1>
                <p className="mt-4 text-sm text-slate-600">
                    Placeholder page — ledger entries and transactions will be
                    shown here.
                </p>
            </div>
        </ManagerLayout>
    );
}
