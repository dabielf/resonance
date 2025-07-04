import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  createTRPCClient, 
  httpBatchLink, 
  httpLink,
  splitLink,
  isNonJsonSerializable 
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import type { AppRouter } from "@worker/trpc/router";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    }
  }
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      splitLink({
        condition: (op) => isNonJsonSerializable(op.input),
        true: httpLink({
          url: "/trpc",
        }),
        false: httpBatchLink({
          url: "/trpc",
        }),
      }),
    ],
  }),
  queryClient,
});

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    context: {
      trpc,
      queryClient,
    },

    Wrap: function WrapComponent({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  });

  return router;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}