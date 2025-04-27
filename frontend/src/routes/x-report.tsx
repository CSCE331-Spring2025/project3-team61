import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Download, RefreshCw, ArrowRight } from "lucide-react";
import BackButton from "../components/back-button";

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
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate summary data
  const summary = data.length > 0
    ? data.reduce((acc, row) => {
      return {
        total_orders: acc.total_orders + Number(row.total_orders),
        total_sales: acc.total_sales + row.total_sales,
        cash_sales: acc.cash_sales + row.cash_sales,
        card_sales: acc.card_sales + row.card_sales,
        check_sales: acc.check_sales + row.check_sales,
        gift_card_sales: acc.gift_card_sales + row.gift_card_sales,
        returns: acc.returns + row.returns,
        voids: acc.voids + row.voids,
        discards: acc.discards + row.discards,
      };
    }, {
      total_orders: 0,
      total_sales: 0,
      cash_sales: 0,
      card_sales: 0,
      check_sales: 0,
      gift_card_sales: 0,
      returns: 0,
      voids: 0,
      discards: 0,
    })
    : null;

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/x-report?date=${date}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to load X-Report: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups for printing functionality.");
      return;
    }

    // Create print content
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>X-Report for ${formattedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; margin-bottom: 10px; }
            h2 { font-size: 16px; color: #4b5563; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f3f4f6; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .summary-row { font-weight: bold; background-color: #f9fafb; }
            .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>X-Report: Sales Per Hour</h1>
          <h2>${formattedDate}</h2>
          <table>
            <thead>
              <tr>
                <th>Hour</th>
                <th class="text-center">Orders</th>
                <th class="text-right">Total Sales</th>
                <th class="text-right">Cash</th>
                <th class="text-right">Card</th>
                <th class="text-right">Check</th>
                <th class="text-right">Gift Card</th>
                <th class="text-right">Returns</th>
                <th class="text-right">Voids</th>
                <th class="text-right">Discards</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  <td>${row.hour}</td>
                  <td class="text-center">${row.total_orders}</td>
                  <td class="text-right">$${row.total_sales.toFixed(2)}</td>
                  <td class="text-right">$${row.cash_sales.toFixed(2)}</td>
                  <td class="text-right">$${row.card_sales.toFixed(2)}</td>
                  <td class="text-right">$${row.check_sales.toFixed(2)}</td>
                  <td class="text-right">$${row.gift_card_sales.toFixed(2)}</td>
                  <td class="text-right">$${row.returns.toFixed(2)}</td>
                  <td class="text-right">$${row.voids.toFixed(2)}</td>
                  <td class="text-right">$${row.discards.toFixed(2)}</td>
                </tr>
              `).join('')}
              ${summary ? `
                <tr class="summary-row">
                  <td><strong>TOTAL</strong></td>
                  <td class="text-center"><strong>${summary.total_orders}</strong></td>
                  <td class="text-right"><strong>$${summary.total_sales.toFixed(2)}</strong></td>
                  <td class="text-right"><strong>$${summary.cash_sales.toFixed(2)}</strong></td>
                  <td class="text-right"><strong>$${summary.card_sales.toFixed(2)}</strong></td>
                  <td class="text-right"><strong>$${summary.check_sales.toFixed(2)}</strong></td>
                  <td class="text-right"><strong>$${summary.gift_card_sales.toFixed(2)}</strong></td>
                  <td class="text-right"><strong>$${summary.returns.toFixed(2)}</strong></td>
                  <td class="text-right"><strong>$${summary.voids.toFixed(2)}</strong></td>
                  <td class="text-right"><strong>$${summary.discards.toFixed(2)}</strong></td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()}</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Download CSV functionality
  const downloadCSV = () => {
    if (data.length === 0) return;

    const headers = ['Hour', 'Total Orders', 'Total Sales', 'Cash', 'Card', 'Check', 'Gift Card', 'Returns', 'Voids', 'Discards'];
    const csvRows = [headers.join(',')];

    // Add data rows
    data.forEach(row => {
      const values = [
        row.hour,
        row.total_orders,
        row.total_sales.toFixed(2),
        row.cash_sales.toFixed(2),
        row.card_sales.toFixed(2),
        row.check_sales.toFixed(2),
        row.gift_card_sales.toFixed(2),
        row.returns.toFixed(2),
        row.voids.toFixed(2),
        row.discards.toFixed(2)
      ];
      csvRows.push(values.join(','));
    });

    // Add summary row if data exists
    if (summary) {
      csvRows.push([
        'TOTAL',
        summary.total_orders,
        summary.total_sales.toFixed(2),
        summary.cash_sales.toFixed(2),
        summary.card_sales.toFixed(2),
        summary.check_sales.toFixed(2),
        summary.gift_card_sales.toFixed(2),
        summary.returns.toFixed(2),
        summary.voids.toFixed(2),
        summary.discards.toFixed(2)
      ].join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `X-Report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-gray-50 min-h-screen relative">
    {/* Back Button */}
    <BackButton to="/manager-nav" className="absolute top-6 left-6 z-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">X-Report: Sales Per Hour</h1>
              <p className="text-blue-100 text-sm mt-1">View and analyze hourly sales data</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                disabled={data.length === 0}
                className="flex items-center px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded text-black text-sm font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print Report"
              >
                <Printer size={16} className="mr-1" />
                Print
              </button>
              <button
                onClick={downloadCSV}
                disabled={data.length === 0}
                className="flex items-center px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded text-black text-sm font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download CSV"
              >
                <Download size={16} className="mr-1" />
                CSV
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mr-2">
                  Date:
                </label>
                <input
                  id="report-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="shadow-sm border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={loadReport}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition duration-150 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} className="mr-2" />
                    Generate Report
                  </>
                )}
              </button>
              {formattedDate && data.length > 0 && (
                <div className="ml-auto text-sm text-gray-600">
                  <span className="font-medium">Showing data for:</span> {formattedDate}
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Report Content */}
          <div ref={printRef} className="px-6 py-4">
            {data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hour
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Sales
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cash
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Card
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gift Card
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Returns
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voids
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discards
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.hour}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{row.total_orders}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">${row.total_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">${row.cash_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">${row.card_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">${row.check_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">${row.gift_card_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">${row.returns.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">${row.voids.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">${row.discards.toFixed(2)}</td>
                      </tr>
                    ))}

                    {/* Summary Row */}
                    {summary && (
                      <tr className="bg-blue-50 border-t-2 border-blue-200">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                        <td className="px-4 py-3 text-sm font-bold text-center">{summary.total_orders}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.total_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.cash_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.card_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.check_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.gift_card_sales.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.returns.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.voids.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right">${summary.discards.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">No data loaded yet.</p>
                <p className="text-gray-400 text-sm mt-2">Select a date and click "Generate Report" to view sales data.</p>
              </div>
            )}
          </div>

          {/* Footer Section */}
          {data.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Report generated on {new Date().toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}