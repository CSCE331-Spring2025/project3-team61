import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
    component: () => (
        <>
            <div className="p-2 flex gap-2">
                <Link to="/" className="[&.active]:font-bold">
                    Home
                </Link>{" "}
                <Link to="/about" className="[&.active]:font-bold">
                    About
                </Link>
                <Link to="/menu-board" className="[&.active]:font-bold">
                    Menu Board
                </Link>
                <Link to="/customer" className="[&.active]:font-bold">
                    Customer
                </Link>
                <Link to="/manager-inventory">
                    Manager Inventory
                </Link>
                <Link to="/manager-price">
                    Manager Price
                </Link>
                <Link to="/manager-employee">
                    Manager Employee
                </Link>
            </div>
            <hr />
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
});
