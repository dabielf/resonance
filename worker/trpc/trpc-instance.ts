import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

// Simple Workers-compatible logger
const logger = {
	error: (data: any, message?: string) => {
		console.error(
			JSON.stringify({
				level: "error",
				time: new Date().toISOString(),
				msg: message || "",
				...data,
			}),
		);
	},
	warn: (data: any, message?: string) => {
		console.warn(
			JSON.stringify({
				level: "warn",
				time: new Date().toISOString(),
				msg: message || "",
				...data,
			}),
		);
	},
	info: (data: any, message?: string) => {
		console.info(
			JSON.stringify({
				level: "info",
				time: new Date().toISOString(),
				msg: message || "",
				...data,
			}),
		);
	},
	debug: (data: any, env: Env, message?: string) => {
		if (env.NODE_ENV && env.NODE_ENV !== "production") {
			console.debug(
				JSON.stringify({
					level: "debug",
					time: new Date().toISOString(),
					msg: message || "",
					...data,
				}),
			);
		}
	},
};

export const t = initTRPC.context<Context>().create({
	errorFormatter({ shape, error, ctx }) {
		// Generate unique error ID for tracking
		const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2)}`;

		// Determine if this is a client error (user mistake) or server error
		const isClientError =
			error.code === "BAD_REQUEST" ||
			error.code === "UNAUTHORIZED" ||
			error.code === "FORBIDDEN" ||
			error.code === "NOT_FOUND" ||
			error.code === "METHOD_NOT_SUPPORTED" ||
			error.code === "TIMEOUT" ||
			error.code === "CONFLICT" ||
			error.code === "PRECONDITION_FAILED" ||
			error.code === "PAYLOAD_TOO_LARGE" ||
			error.code === "UNPROCESSABLE_CONTENT" ||
			error.code === "TOO_MANY_REQUESTS" ||
			error.code === "CLIENT_CLOSED_REQUEST";

		// Log level based on error type
		const logLevel = isClientError ? "warn" : "error";

		// Create comprehensive error log
		const errorLogData = {
			errorId,
			trpc: {
				code: error.code,
				message: error.message,
				operation: shape.data?.path || "unknown",
				httpStatus: shape.data?.httpStatus,
				isClientError,
			},
			context: {
				userId: ctx?.userId || null,
				// Add request correlation ID if available
				requestId: ctx?.requestId || null,
				timestamp: new Date().toISOString(),
			},
			// Include stack trace in development, exclude in production
			...(ctx?.env.NODE_ENV !== "production" && {
				stack: error.stack,
			}),
		};

		// Log the error with appropriate level
		logger[logLevel](errorLogData, `TRPC Error: ${error.message}`);

		// Return enhanced error shape with error ID for client tracking
		return {
			...shape,
			data: {
				...shape.data,
				errorId,
				// Don't expose stack traces in production
				...(ctx?.env.NODE_ENV !== "production" && {
					stack: error.stack,
				}),
			},
		};
	},
});
