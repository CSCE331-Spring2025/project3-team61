import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as RechartsOriginal from "recharts";

// Create properly typed components by casting
const {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} = RechartsOriginal as any;

export const Route = createFileRoute("/manager-sales")({
  component: SalesReportPage,
});

// Define proper interfaces for our data
interface SalesItem {
  menu_item: string;
  category?: string;
  total_orders: number;
  total_sales: number;
}

interface SummaryMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItem: string;
  salesGrowth: number;
}

const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

function SalesReportPage() {
  // State for date filters
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-02-01");
  const [reportData, setReportData] = useState<SalesItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Advanced filtering options
  const [viewMode, setViewMode] = useState<"table" | "chart" | "dashboard">("dashboard");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("sales");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [comparisonPeriod, setComparisonPeriod] = useState(false);
  // const [comparisonData, setComparisonData] = useState<SalesItem[]>([]);
  const [topItemsCount, setTopItemsCount] = useState(5);

  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItem: "",
    salesGrowth: 0,
  });

  // Load initial data when component mounts
  useEffect(() => {
    fetchSalesReport();
    // In a real app, we would also fetch categories here
    fetchCategories();
  }, []);

  // FIXME: Fetch list of categories, API call
  const fetchCategories = async () => {
    setCategories(["Beverages", "Entrees", "Appetizers", "Desserts", "Specials"]);
  };

  const fetchSalesReport = async () => {
    setError("");
    setLoading(true);
    try {
      // In a real app, we'd include all filters in the request
      const res = await fetch(`/api/sales-report?start=${startDate}&end=${endDate}&category=${categoryFilter}`);
      const data = await res.json();
      setReportData(data);
      
      // Calculate summary metrics
      if (data.length > 0) {
        const totalSales = data.reduce((sum: number, item: SalesItem) => sum + item.total_sales, 0);
        const totalOrders = data.reduce((sum: number, item: SalesItem) => sum + item.total_orders, 0);
        const topSellingItem = [...data].sort((a, b) => b.total_orders - a.total_orders)[0]?.menu_item || "";
        
        setSummaryMetrics({
          totalSales,
          totalOrders,
          averageOrderValue: totalOrders ? totalSales / totalOrders : 0,
          topSellingItem,
          salesGrowth: 0, // This would be calculated with comparison data
        });
      }
      
      // If comparison is enabled, fetch previous period data
      if (comparisonPeriod) {
        fetchComparisonData();
      }
    } catch (err) {
      setError("Failed to load sales report.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    // Calculate previous period dates (same length as selected period)
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const daysDiff = Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 3600 * 24));
    
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    try {
      const res = await fetch(`/api/sales-report?start=${formatDate(prevStart)}&end=${formatDate(prevEnd)}`);
      const data = await res.json();
      // setComparisonData(data);
      
      // Calculate growth rate if we have both current and previous data
      if (data.length > 0 && reportData.length > 0) {
        const prevTotalSales = data.reduce((sum: number, item: SalesItem) => sum + item.total_sales, 0);
        const currentTotalSales = summaryMetrics.totalSales;
        
        const growthRate = prevTotalSales > 0 
          ? ((currentTotalSales - prevTotalSales) / prevTotalSales) * 100 
          : 0;
        
        setSummaryMetrics(prev => ({
          ...prev,
          salesGrowth: growthRate
        }));
      }
    } catch (err) {
      console.error("Failed to fetch comparison data", err);
    }
  };

  // Apply filters and sorting to the data
  const getFilteredData = () => {
    let filtered = [...reportData];
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.menu_item.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting - FIXED TypeScript error here
    filtered.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;
      
      if (sortBy === "sales") {
        valueA = a.total_sales;
        valueB = b.total_sales;
      } else if (sortBy === "orders") {
        valueA = a.total_orders;
        valueB = b.total_orders;
      } else {
        valueA = a.menu_item;
        valueB = b.menu_item;
      }
      
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc" 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        // Convert to numbers for numeric comparison
        const numA = typeof valueA === "number" ? valueA : Number(valueA);
        const numB = typeof valueB === "number" ? valueB : Number(valueB);
        
        return sortDirection === "asc" 
          ? numA - numB 
          : numB - numA;
      }
    });
    
    return filtered;
  };

  const downloadCSV = () => {
    if (reportData.length === 0) return;
    
    const filteredData = getFilteredData();
    const headers = ["Menu Item", "Category", "Total Orders", "Total Sales", "Average Order Value"];
    const rows = filteredData.map(row => [
      row.menu_item,
      row.category || "Beverage", // hardcoded in
      row.total_orders,
      row.total_sales.toFixed(2),
      (row.total_sales / row.total_orders).toFixed(2)
    ]);
    
    const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sales_Report_${startDate}_to_${endDate}.csv`;
    link.click();
  };

  const handlePredefinedDate = (period: string) => {
    const today = new Date();
    let start = new Date();
    
    switch (period) {
      case "today":
        start = new Date(today);
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        today.setDate(today.getDate() - 1);
        break;
      case "week":
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        break;
      case "quarter":
        start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        break;
      default:
        break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Prepare chart data - get top N items by sales
  const getTopItemsChartData = () => {
    const filtered = getFilteredData();
    const topItems = [...filtered]
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, topItemsCount);
      
    return topItems;
  };

  // For pie chart data
  const getCategoryData = () => {
    return reportData.reduce((acc: Array<{name: string, value: number}>, item) => {
      const existingCategory = acc.find(c => c.name === (item.category || 'Uncategorized'));
      if (existingCategory) {
        existingCategory.value += item.total_sales;
      } else {
        acc.push({ name: item.category || 'Uncategorized', value: item.total_sales });
      }
      return acc;
    }, []);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const filteredData = getFilteredData();
  const topItemsChartData = getTopItemsChartData();
  const categoryData = getCategoryData();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-3xl font-bold">Sales Performance Analytics</h1>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button 
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Table View
          </button>
          <button 
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "chart" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Charts
          </button>
          <button 
            onClick={() => setViewMode("dashboard")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      {viewMode === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold">
              {formatCurrency(summaryMetrics.totalSales)}
            </p>
            {summaryMetrics.salesGrowth !== 0 && (
              <p className={`text-sm ${summaryMetrics.salesGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {summaryMetrics.salesGrowth > 0 ? '↑' : '↓'} {Math.abs(summaryMetrics.salesGrowth).toFixed(1)}% from previous period
              </p>
            )}
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{summaryMetrics.totalOrders}</p>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-500 text-sm">Average Order Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(summaryMetrics.averageOrderValue)}
            </p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="border rounded px-2 py-1 text-sm" 
              />
              <span>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="border rounded px-2 py-1 text-sm" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select</label>
            <div className="flex gap-1">
              <button 
                onClick={() => handlePredefinedDate("today")}
                className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs"
              >
                Today
              </button>
              <button 
                onClick={() => handlePredefinedDate("week")}
                className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs"
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => handlePredefinedDate("month")}
                className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs"
              >
                Last 30 Days
              </button>
            </div>
          </div>
          
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="compareToggle"
                checked={comparisonPeriod} 
                onChange={() => setComparisonPeriod(!comparisonPeriod)} 
              />
              <label htmlFor="compareToggle" className="text-sm">Compare to previous period</label>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-l px-2 py-1"
              >
                <option value="sales">Total Sales</option>
                <option value="orders">Order Count</option>
                <option value="name">Item Name</option>
              </select>
              <button 
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                className="border border-l-0 rounded-r px-2 py-1"
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search items..."
              className="border rounded px-2 py-1"
            />
          </div>
          
          <button
            onClick={fetchSalesReport}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Loading..." : "Generate Report"}
          </button>
          
          {reportData.length > 0 && (
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export to CSV
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Dashboard View with Charts and Table */}
      {viewMode === "dashboard" && reportData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart for Top Items */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium mb-4">Top {topItemsCount} Items by Sales</h2>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm">Show top:</label>
              <select 
                value={topItemsCount}
                onChange={(e) => setTopItemsCount(Number(e.target.value))}
                className="border rounded text-sm p-1"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topItemsChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="menu_item" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      if (name === "total_sales") {
                        return [formatCurrency(Number(value)), "Sales"];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total_sales" name="Sales" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart for Category Distribution */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium mb-4">Sales by Category</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}: {name: string, percent: number}) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Top Items Table */}
          <div className="bg-white p-4 rounded shadow lg:col-span-2">
            <h2 className="text-lg font-medium mb-4">Top Selling Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Menu Item</th>
                    <th className="border px-4 py-2 text-left">Category</th>
                    <th className="border px-4 py-2 text-center">Total Orders</th>
                    <th className="border px-4 py-2 text-right">Total Sales</th>
                    <th className="border px-4 py-2 text-right">Avg. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {topItemsChartData.map((row, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border px-4 py-2">{row.menu_item}</td>
                      <td className="border px-4 py-2">{row.category || "N/A"}</td>
                      <td className="border px-4 py-2 text-center">{row.total_orders}</td>
                      <td className="border px-4 py-2 text-right">{formatCurrency(row.total_sales)}</td>
                      <td className="border px-4 py-2 text-right">
                        {formatCurrency(row.total_sales / row.total_orders)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === "chart" && reportData.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-4">Sales Performance Chart</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="menu_item" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === "total_sales") {
                      return [formatCurrency(Number(value)), "Sales"];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="total_sales" name="Total Sales" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="total_orders" name="Total Orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table View */}
      {(viewMode === "table" || !reportData.length) && (
        <div className="bg-white p-4 rounded shadow">
          {reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Menu Item</th>
                    <th className="border px-4 py-2 text-left">Category</th>
                    <th className="border px-4 py-2 text-center">Total Orders</th>
                    <th className="border px-4 py-2 text-right">Total Sales</th>
                    <th className="border px-4 py-2 text-right">Avg. Price</th>
                    <th className="border px-4 py-2 text-center">% of Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => {
                    const percentOfSales = (row.total_sales / summaryMetrics.totalSales) * 100;
                    return (
                      <tr key={idx} className="odd:bg-white even:bg-gray-50">
                        <td className="border px-4 py-2">{row.menu_item}</td>
                        <td className="border px-4 py-2">{row.category || "N/A"}</td>
                        <td className="border px-4 py-2 text-center">{row.total_orders}</td>
                        <td className="border px-4 py-2 text-right">{formatCurrency(row.total_sales)}</td>
                        <td className="border px-4 py-2 text-right">
                          {formatCurrency(row.total_sales / row.total_orders)}
                        </td>
                        <td className="border px-4 py-2 text-center">{percentOfSales.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-medium">
                  <tr>
                    <td colSpan={2} className="border px-4 py-2">Total</td>
                    <td className="border px-4 py-2 text-center">{summaryMetrics.totalOrders}</td>
                    <td className="border px-4 py-2 text-right">{formatCurrency(summaryMetrics.totalSales)}</td>
                    <td className="border px-4 py-2 text-right">
                      {formatCurrency(summaryMetrics.averageOrderValue)}
                    </td>
                    <td className="border px-4 py-2 text-center">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            !loading && (
              <p className="text-gray-500 text-center py-10">
                No data available. Choose a date range and generate the report.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}