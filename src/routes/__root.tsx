import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

// Lazy load devtools only in development
const TanStackRouterDevtools = 
	process.env.NODE_ENV === "production"
		? () => null // Return null in production
		: lazy(() =>
				import("@tanstack/react-router-devtools").then((res) => ({
					default: res.TanStackRouterDevtools,
				}))
		  );

export const Route = createRootRoute({
	component: () => (
		<ThemeProvider>
			<Outlet />
			<Suspense fallback={null}>
				<TanStackRouterDevtools position="bottom-right" />
			</Suspense>
			<Toaster />
		</ThemeProvider>
	),
});
