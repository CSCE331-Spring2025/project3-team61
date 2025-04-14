import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, RefreshCw, Filter, Calendar, Clock } from "lucide-react";

export const Route = createFileRoute("/manager-product-usage")({
  component: ProductUsagePage,
});

type UsageDataPoint = {
  product_name: string;
  count: number;
};

type TimeSeriesDataPoint = {
  hour: number;
  [key: string]: number | string;
};

function ProductUsagePage() {
  // State management
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [timeRange, setTimeRange] = useState({ start: "0", end: "23" });
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "bar" | "time">("table");
  const [sortConfig, setSortConfig] = useState({ key: "count", direction: "desc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Load data initially and set up polling if needed
  useEffect(() => {
    loadUsage();
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  // Set up auto-refresh if interval is set
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(loadUsage, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, dateRange, timeRange]);

  const loadUsage = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch aggregated data
      const res = await fetch(
        `/api/product-usage?startDate=${dateRange.start}&endDate=${dateRange.end}&startHour=${timeRange.start}&endHour=${timeRange.end}`
      );
      const json = await res.json();
      setUsageData(json);
      
      // Fetch time series data for the chart
      const timeRes = await fetch(
        `/api/product-usage/timeseries?startDate=${dateRange.start}&endDate=${dateRange.end}&startHour=${timeRange.start}&endHour=${timeRange.end}`
      );
      const timeJson = await timeRes.json();
      setTimeSeriesData(timeJson);
    } catch (err) {
      setError("Failed to load product usage data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (usageData.length === 0) return;
    
    const filename = dateRange.start === dateRange.end 
      ? `Product_Usage_${dateRange.start}_${timeRange.start}-${timeRange.end}.csv`
      : `Product_Usage_${dateRange.start}_to_${dateRange.end}.csv`;
    
    const csv = [
      ["Product Name", "Amount Used"],
      ...usageData.map((row) => [row.product_name, row.count]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Sort the data based on current sort configuration
  const sortedData = [...usageData].sort((a, b) => {
    if (sortConfig.key === "product_name") {
      return sortConfig.direction === "asc" 
        ? a.product_name.localeCompare(b.product_name)
        : b.product_name.localeCompare(a.product_name);
    } else {
      return sortConfig.direction === "asc" 
        ? a.count - b.count 
        : b.count - a.count;
    }
  });

  // Filter data based on search term
  const filteredData = sortedData.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top 5 products for chart display
  const topProducts = [...usageData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleSort = (key: "product_name" | "count") => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    });
  };

  const toggleRefresh = () => {
    setRefreshInterval(refreshInterval ? null : 60); // Toggle between 60 seconds and off
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Usage Report</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleRefresh}
            className={`flex items-center gap-1 px-3 py-2 rounded ${
              refreshInterval ? "bg-blue-100 text-blue-700" : "bg-gray-100"
            }`}
            title={refreshInterval ? "Auto-refresh every minute (on)" : "Auto-refresh (off)"}
          >
            <RefreshCw size={16} />
            {refreshInterval ? "Auto" : "Manual"}
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-2 rounded ${
              viewMode === "table" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("bar")}
            className={`px-3 py-2 rounded ${
              viewMode === "bar" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setViewMode("time")}
            className={`px-3 py-2 rounded ${
              viewMode === "time" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Time Series
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <Calendar size={16} className="mr-2" />
              <span className="font-medium">Date Range</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border px-3 py-2 rounded"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <Clock size={16} className="mr-2" />
              <span className="font-medium">Hours (0-23)</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={0}
                max={23}
                value={timeRange.start}
                onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                className="border px-3 py-2 rounded w-20"
              />
              <span>to</span>
              <input
                type="number"
                min={0}
                max={23}
                value={timeRange.end}
                onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                className="border px-3 py-2 rounded w-20"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center mb-2">
              <Filter size={16} className="mr-2" />
              <span className="font-medium">Filter</span>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadUsage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>

          {usageData.length > 0 && (
            <div className="flex items-end">
              <button
                onClick={downloadCSV}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("product_name")}
                  >
                    Product Name
                    {sortConfig.key === "product_name" && (
                      <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("count")}
                  >
                    Amount Used
                    {sortConfig.key === "count" && (
                      <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{row.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{row.count.toLocaleString()}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={2} className="px-6 py-10 text-center text-gray-500">
                      No data available for selected parameters.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-3 text-right font-medium">Total</td>
                    <td className="px-6 py-3 text-right font-medium">
                      {filteredData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      )}

      {viewMode === "bar" && !loading && usageData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4">Top Products Usage</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Amount Used" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === "time" && !loading && timeSeriesData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium mb-4">Usage Over Time</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                {topProducts.map((product, index) => (
                  <Line 
                    key={product.product_name}
                    type="monotone" 
                    dataKey={product.product_name} 
                    stroke={`hsl(${index * 60}, 70%, 50%)`} 
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Showing {filteredData.length} of {usageData.length} products
        {searchTerm && ` (filtered by "${searchTerm}")`}
        {refreshInterval && ` • Auto-refreshing every ${refreshInterval} seconds`}
        {dateRange.start !== dateRange.end && ` • Date range: ${dateRange.start} to ${dateRange.end}`}
      </div>
    </div>
  );
}