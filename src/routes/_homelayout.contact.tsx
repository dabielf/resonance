import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_homelayout/contact')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/contact"!</div>
}
