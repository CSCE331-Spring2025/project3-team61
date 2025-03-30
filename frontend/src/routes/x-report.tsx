import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/x-report")({
    component: RouteComponent,
});

function RouteComponent() {
    // Placeholder data
    const reportData = {
        totalSales: "$1,420.50",
        transactions: 58,
        averageTransaction: "$24.49",
        topItems: [
            { name: "Brown Sugar Milk Tea", sold: 25 },
            { name: "Taro Slush", sold: 20 },
            { name: "Strawberry Matcha", sold: 18 },
        ],
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">X-Report</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <ReportCard title="Total Sales" value={reportData.totalSales} />
                <ReportCard title="Transactions" value={reportData.transactions.toString()} />
                <ReportCard title="Avg. Transaction" value={reportData.averageTransaction} />
            </div>

            <h2 className="text-xl font-semibold mb-2">Top Selling Items</h2>
            <ul className="mb-6">
                {reportData.topItems.map((item, idx) => (
                    <li key={idx} className="flex justify-between border-b py-2">
                        <span>{item.name}</span>
                        <span>{item.sold} sold</span>
                    </li>
                ))}
            </ul>

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