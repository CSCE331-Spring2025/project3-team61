import { createFileRoute } from '@tanstack/react-router'
import {
  DollarSign,
  Boxes,
  Users,
  FileText,
  FileBarChart2,
  BarChart3,
  LineChart,
} from "lucide-react";

export const Route = createFileRoute('/manager-nav')({
  component: RouteComponent,
})

function RouteComponent() {
  const buttons = [
    { label: "Price", icon: <DollarSign size={20} /> },
    { label: "Inventory", icon: <Boxes size={20} /> },
    { label: "Employees", icon: <Users size={20} /> },
    { label: "X-Report", icon: <LineChart size={20} /> },
    { label: "Z-Report", icon: <FileText size={20} /> },
    { label: "Product Usage Report", icon: <FileBarChart2 size={20} /> },
    { label: "Sales Report", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Menu (Manager)</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buttons.map(({ label, icon }) => (
          <button
            key={label}
            className="flex items-center gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded text-left"
            onClick={() => alert(`${label} clicked`)} // Replace with real logic
          >
            {icon}
            <span className="text-lg font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
