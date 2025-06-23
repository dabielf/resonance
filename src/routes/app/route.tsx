import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@clerk/clerk-react"

export const Route = createFileRoute('/app')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isLoaded,isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isLoaded && !isSignedIn) {
    return <Navigate to="/" />
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 gap-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
