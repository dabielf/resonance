import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/contacts/list')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/contacts/list"!</div>
}
