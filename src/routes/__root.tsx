import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const Route = createRootRoute({
	component: () => (
		<ThemeProvider>
			<Outlet />
			<TanStackRouterDevtools position="bottom-right" />
			<Toaster />
		</ThemeProvider>
	),
});
