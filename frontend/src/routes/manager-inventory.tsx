import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/manager-inventory')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello, this is the manager inventory page!</div>
}