import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/menu_board')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello, this is the menu board!</div>
}
