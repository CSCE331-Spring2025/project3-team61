import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/x-report")({
    component: XReportPage,
});

function XReportPage() {
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0]; // 'YYYY-MM-DD'
    });

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/x-report?date=${date}`);
            const json = await response.json();
            setData(json);
        } catch (err) {
            alert("Failed to load X-Report.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-blue-700">X-Report: Sales Per Hour</h1>

            <div className="flex gap-4 mb-6 items-center">
                <label htmlFor="report-date" className="font-medium">
                    Enter Date:
                </label>
                <input
                    id="report-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border rounded px-2 py-1"
                />
                <button
                    onClick={loadReport}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {loading ? "Loading..." : "Load Report"}
                </button>
            </div>

            {data.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border">Hour</th>
                                <th className="p-2 border">Total Orders</th>
                                <th className="p-2 border">Total Sales</th>
                                <th className="p-2 border">Cash</th>
                                <th className="p-2 border">Card</th>
                                <th className="p-2 border">Check</th>
                                <th className="p-2 border">Gift Card</th>
                                <th className="p-2 border">Returns</th>
                                <th className="p-2 border">Voids</th>
                                <th className="p-2 border">Discards</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="even:bg-gray-50">
                                    <td className="border px-2 py-1 text-center">{row.hour}</td>
                                    <td className="border px-2 py-1 text-center">{row.total_orders}</td>
                                    <td className="border px-2 py-1 text-right">${row.total_sales.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">${row.cash_sales.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">${row.card_sales.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">${row.check_sales.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">${row.gift_card_sales.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">${row.returns.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">${row.voids.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">${row.discards.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-600 italic mt-6">No data loaded yet.</p>
            )}
        </div>
    );
}
