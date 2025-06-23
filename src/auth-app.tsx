import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { createRouter } from "./router";

// Create a new router instance
const router = createRouter()

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppWithAuthContext() {
  const auth = useAuth();
  return (
    <RouterProvider router={router} context={{ auth }} />
  )
}