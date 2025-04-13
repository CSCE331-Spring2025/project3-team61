import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
    component: () => (
        <>
            {
                // <div className="p-2 flex gap-2">
                //     <Link to="/" className="[&.active]:font-bold">
                //         Home
                //     </Link>
                //     <Link to="/employee-nav" className="[&.active]:font-bold">
                //         Employee Nav
                //     </Link>
                //     <Link to="/cashier" className="[&.active]:font-bold">
                //         Cashier
                //     </Link>
                //     <Link to="/menu-board" className="[&.active]:font-bold">
                //         Menu Board
                //     </Link>
                //     <Link to="/manager-nav" className="[&.active]:font-bold">
                //         Manager
                //     </Link>
                //     <Link to="/customer" className="[&.active]:font-bold">
                //         Customer
                //     </Link>
                // </div>
                // <hr />
            }
            <Outlet />
            {
                // <TanStackRouterDevtools />
            }
        </>
    ),
});
