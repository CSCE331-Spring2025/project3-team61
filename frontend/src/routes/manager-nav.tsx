import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  DollarSign,
  Boxes,
  Users,
  FileText,
  FileBarChart2,
  BarChart3,
  LineChart,
} from "lucide-react";
import BackButton from "../components/back-button";

function RouteComponent() {
  const router = useRouter();

  const buttons = [
    { label: "Price", icon: <DollarSign size={20} />, path: "/manager-price" },
    { label: "Inventory", icon: <Boxes size={20} />, path: "/manager-inventory" },
    { label: "Employees", icon: <Users size={20} />, path: "/manager-employee" },
    { label: "X-Report", icon: <LineChart size={20} />, path: "/x-report" },
    { label: "Z-Report", icon: <FileText size={20} />, path: "/z-report" },
    { label: "Product Usage Report", icon: <FileBarChart2 size={20} />, path: "/manager-product-usage" },
    { label: "Sales Report", icon: <BarChart3 size={20} />, path: "/manager-sales" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      {/* Top-left corner back button */}
      <BackButton to="/manager-nav" className="absolute top-6 left-6 z-50" />

      <h1 className="text-3xl font-bold mb-8 text-center">Menu (Manager)</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buttons.map(({ label, icon, path }) => (
          <button
            key={label}
            className="flex items-center gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded text-left"
            onClick={() => router.navigate({ to: path })}
          >
            {icon}
            <span className="text-lg font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/manager-nav')({
  component: RouteComponent,
});
