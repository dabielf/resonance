import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	build: {
		target: 'es2022', // Support top-level await
	},
	optimizeDeps: {
		esbuildOptions: {
			supported: {
				'top-level-await': true,
			},
		},
	},
	esbuild: {
		supported: {
			'top-level-await': true,
		},
	},
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		cloudflare(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		allowedHosts: ["handy-marmoset-remotely.ngrok-free.app"],
		hmr: {
			overlay: false, // Disable the overlay for network errors
		},
	},
});
