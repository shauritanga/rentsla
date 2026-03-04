import ManagerLayout from "@/Layouts/ManagerLayout";

export default function ComingSoon({
    title,
    user,
    building,
    activeNav = "comingsoon",
}: {
    title: string;
    user: any;
    building: any;
    activeNav?: string;
}) {
    return (
        <ManagerLayout
            title={title}
            user={user}
            building={building}
            activeNav={activeNav}
        >
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <svg
                        className="w-12 h-12 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    Coming Soon
                </h1>
                <p className="text-slate-500 max-w-md">
                    This feature is currently under development. We're working
                    hard to bring you an amazing experience. Stay tuned!
                </p>
            </div>
        </ManagerLayout>
    );
}
