import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/creation/resources/$resourceId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/creation/resources/$resourceId"!</div>
}
