import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/contacts/engage')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/contacts/engage"!</div>
}
