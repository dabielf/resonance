import { Hono } from "hono";
import { trimTrailingSlash } from 'hono/trailing-slash'
import agent from "../agents";

const app = new Hono<{ Bindings: Env }>();

app.use(trimTrailingSlash())

app.get('/api', (c) => {
    console.log('/api - request received')
	return c.json({
		data: "Resonance (with Hono)",
	});
});

app.get('/api/agent', (c) => {
    console.log('/api/agent - request received')
	return c.json({
		data: agent,
	});
})

export default app;