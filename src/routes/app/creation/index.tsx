import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/creation/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/creation/"!</div>
}
