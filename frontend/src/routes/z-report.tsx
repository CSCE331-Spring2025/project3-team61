import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/z-report")({
    component: RouteComponent,
});

function RouteComponent() {
    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const reportData = {
        totalSales: "$2,304.80",
        transactions: 92,
        cash: "$1,100.00",
        card: "$1,204.80",
        refunds: "$45.00",
        discounts: "$76.25",
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-1">Z-Report</h1>
            <p className="text-gray-600 mb-6">{today}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <ReportCard title="Total Sales" value={reportData.totalSales} />
                <ReportCard title="Transactions" value={reportData.transactions.toString()} />
                <ReportCard title="Cash Payments" value={reportData.cash} />
                <ReportCard title="Card Payments" value={reportData.card} />
                <ReportCard title="Refunds Issued" value={reportData.refunds} />
                <ReportCard title="Discounts Given" value={reportData.discounts} />
            </div>

            <button
                className="w-full bg-slate-700 text-white h-15 rounded-lg font-bold mt-10"
                onClick={() => window.print()}
            >
                Print Report
            </button>
        </div>
    );
}

function ReportCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-gray-100 p-4 rounded shadow-sm">
            <h3 className="text-md font-semibold text-gray-700">{title}</h3>
            <p className="text-xl font-bold">{value}</p>
        </div>
    );
}