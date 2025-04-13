import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employee-nav")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex justify-center h-lvh flex-wrap flex-col content-center gap-3 font-bold text-center">
            <Link
                to="/cashier"
                className="gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded"
            >
                Cashier Page
            </Link>
            <Link
                to="/manager-nav"
                className="gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded"
            >
                Manager Navigation
            </Link>
            <button
                onClick={() => (window.location.href = "/logout")}
                className="gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded"
            >
                Sign Out
            </button>
        </div>
    );
}
