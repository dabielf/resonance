export async function createContext({
	req,
	env,
	workerCtx,
	userId,
}: {
	req: Request;
	env: Env;
	workerCtx: ExecutionContext;
	userId: number;
}) {
	return {
		req,
		env,
		workerCtx,
		userId,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
