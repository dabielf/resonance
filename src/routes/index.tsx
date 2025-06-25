import { IconInnerShadowTop } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex w-screen h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-2">
				<div className="flex items-center scale-200 mb-6">
					<IconInnerShadowTop className="!size-5" />
					<span className="text-xl font-semibold">Resonance</span>
				</div>
				<div className="text-sm text-muted-foreground">
					An AI assistant <strong>removing friction</strong> for solopreneurs.
				</div>
				<div className="text-sm text-muted-foreground -mt-2">
					<strong>Amplify</strong> your voice. <strong>Resonate</strong> with
					your audience, clients and prospects. <strong>Grow</strong> your
					business.
				</div>
				<div className="text-base font-semibold mt-6">Beta starting soon.</div>
			</div>
		</div>
	);
}
