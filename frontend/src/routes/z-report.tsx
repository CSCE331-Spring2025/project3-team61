import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Download, RefreshCw, ArrowRight, BarChart3, CreditCard, DollarSign, Receipt } from "lucide-react";
import BackButton from "../components/back-button";

export const Route = createFileRoute("/z-report")({
  component: ZReportPage,
});

function ZReportPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/z-report?date=${date}`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to load Z-Report: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups for printing functionality.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Z-Report for ${formattedDate}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 { 
              color: #2563eb; 
              margin-bottom: 4px; 
              font-size: 24px;
            }
            h2 { 
              font-size: 18px; 
              color: #4b5563; 
              margin-top: 24px;
              margin-bottom: 12px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
            }
            .date { 
              font-size: 16px; 
              color: #6b7280; 
              margin-top: 0;
              margin-bottom: 24px;
            }
            .card {
              background-color: #f9fafb;
              padding: 12px 16px;
              margin-bottom: 8px;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            .card-title {
              color: #374151;
              font-size: 14px;
              font-weight: 500;
              margin: 0 0 4px 0;
            }
            .card-value {
              color: #111827;
              font-size: 18px;
              font-weight: 700;
              margin: 0;
            }
            .footer { 
              margin-top: 30px; 
              font-size: 12px; 
              color: #6b7280; 
              text-align: center; 
            }
            .highlight-card {
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
            }
            .highlight-card .card-value {
              color: #1e40af;
            }
            @media print {
              button { display: none; }
              body { 
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <h1>Z-Report</h1>
          <p class="date">${formattedDate}</p>
          
          <h2>Sales Summary</h2>
          <div class="card">
            <h3 class="card-title">Total Transactions</h3>
            <p class="card-value">${report.totalTransactions}</p>
          </div>
          <div class="card">
            <h3 class="card-title">Gross Sales</h3>
            <p class="card-value">$${report.grossSales.toFixed(2)}</p>
          </div>
          <div class="card">
            <h3 class="card-title">Net Revenue (Before Tax)</h3>
            <p class="card-value">$${report.netRevenue.toFixed(2)}</p>
          </div>
          <div class="card">
            <h3 class="card-title">Sales Tax (8.25%)</h3>
            <p class="card-value">$${report.salesTax.toFixed(2)}</p>
          </div>
          <div class="card highlight-card">
            <h3 class="card-title">Total With Tax</h3>
            <p class="card-value">$${report.totalWithTax.toFixed(2)}</p>
          </div>
          
          <h2>Payments</h2>
          <div class="card">
            <h3 class="card-title">Cash Payments</h3>
            <p class="card-value">$${report.cash.toFixed(2)}</p>
          </div>
          <div class="card">
            <h3 class="card-title">Card Payments</h3>
            <p class="card-value">$${report.card.toFixed(2)}</p>
          </div>
          
          <h2>Adjustments</h2>
          <div class="card">
            <h3 class="card-title">Returns</h3>
            <p class="card-value">$${report.returns.toFixed(2)}</p>
          </div>
          <div class="card">
            <h3 class="card-title">Voids</h3>
            <p class="card-value">$${report.voids.toFixed(2)}</p>
          </div>
          <div class="card">
            <h3 class="card-title">Discards</h3>
            <p class="card-value">$${report.discards.toFixed(2)}</p>
          </div>
          
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
    if (!report) return;

    const headers = [
      'Date',
      'Total Transactions',
      'Gross Sales',
      'Net Revenue',
      'Sales Tax',
      'Total With Tax',
      'Cash Payments',
      'Card Payments',
      'Returns',
      'Voids',
      'Discards'
    ];

    const values = [
      date,
      report.totalTransactions,
      report.grossSales.toFixed(2),
      report.netRevenue.toFixed(2),
      report.salesTax.toFixed(2),
      report.totalWithTax.toFixed(2),
      report.cash.toFixed(2),
      report.card.toFixed(2),
      report.returns.toFixed(2),
      report.voids.toFixed(2),
      report.discards.toFixed(2)
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' +
      headers.join(',') + '\n' +
      values.join(',');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Z-Report_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Button */}
      <BackButton to="/manager-nav" className="absolute top-6 left-6 z-50" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Z-Report</h1>
              <p className="text-blue-100 text-sm mt-1">End of day sales summary</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                disabled={!report}
                className="flex items-center px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded text-black text-sm font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print Report"
              >
                <Printer size={16} className="mr-1" />
                Print
              </button>
              <button
                onClick={downloadCSV}
                disabled={!report}
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
              {date && report && (
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
            {report ? (
              <div className="space-y-6">
                <section>
                  <div className="flex items-center mb-3">
                    <BarChart3 size={20} className="text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Sales Summary</h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total Transactions</h3>
                      <p className="text-2xl font-bold">{report.totalTransactions}</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Gross Sales</h3>
                      <p className="text-2xl font-bold text-gray-800">${report.grossSales.toFixed(2)}</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Net Revenue (Before Tax)</h3>
                      <p className="text-2xl font-bold text-gray-800">${report.netRevenue.toFixed(2)}</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Sales Tax (8.25%)</h3>
                      <p className="text-2xl font-bold text-gray-800">${report.salesTax.toFixed(2)}</p>
                    </div>

                    <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-blue-600 mb-1">Total With Tax</h3>
                      <p className="text-3xl font-bold text-blue-700">${report.totalWithTax.toFixed(2)}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center mb-3">
                    <CreditCard size={20} className="text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Payments</h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Cash Payments</h3>
                          <p className="text-2xl font-bold text-gray-800">${report.cash.toFixed(2)}</p>
                        </div>
                        <DollarSign size={24} className="text-green-500 opacity-70" />
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Card Payments</h3>
                          <p className="text-2xl font-bold text-gray-800">${report.card.toFixed(2)}</p>
                        </div>
                        <CreditCard size={24} className="text-blue-500 opacity-70" />
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center mb-3">
                    <Receipt size={20} className="text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-800">Adjustments</h2>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Returns</h3>
                      <p className="text-xl font-bold text-red-600">${report.returns.toFixed(2)}</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Voids</h3>
                      <p className="text-xl font-bold text-red-600">${report.voids.toFixed(2)}</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Discards</h3>
                      <p className="text-xl font-bold text-red-600">${report.discards.toFixed(2)}</p>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No report data loaded yet.</p>
                <p className="text-gray-400 text-sm mt-2">Select a date and click "Generate Report" to view Z-Report data.</p>
              </div>
            )}
          </div>

          {/* Footer Section */}
          {report && (
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