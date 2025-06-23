import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/creation/resources')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/creation/resources"!</div>
}
