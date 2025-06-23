import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/creation/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/contacts/create"!</div>
}
