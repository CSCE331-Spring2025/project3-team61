import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: Index,
});

function Index() {
    return (
        <div className="flex justify-center h-lvh flex-wrap flex-col content-center gap-3 font-bold text-center">
            <a href="/auth/google">
                <div className="gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded">
                    Login with Google
                </div>
            </a>
            <Link
                to="/customer"
                className="gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded"
            >
                Customer
            </Link>
            <Link
                to="/menu-board"
                className="gap-3 p-4 bg-gray-200 hover:bg-gray-300 rounded"
            >
                Menu Board
            </Link>
        </div>
    );
}
