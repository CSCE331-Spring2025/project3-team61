import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/manager-price')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello, this is the manager price page!</div>
}
