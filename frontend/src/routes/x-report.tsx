import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/x-report")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/x-report"!</div>;
}
