import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/projects/assistant')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/projects/assistant"!</div>
}
