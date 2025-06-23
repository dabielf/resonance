import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/creation/writers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/contacts/writers"!</div>
}
