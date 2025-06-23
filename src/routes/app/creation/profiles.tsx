import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/creation/profiles')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/creation/profiles"!</div>
}
