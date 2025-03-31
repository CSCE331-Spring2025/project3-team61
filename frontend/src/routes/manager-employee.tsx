import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/manager-employee')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello, this is the manager employee page!</div>
}
