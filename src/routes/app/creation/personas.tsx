import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/creation/personas')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/creation/personas"!</div>
}
