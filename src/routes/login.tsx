import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
} from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex w-screen h-screen items-center justify-center">
			<SignedOut>
				<Button asChild>
					<SignInButton forceRedirectUrl={"/app"} mode="modal">
						Log into Resonance
					</SignInButton>
				</Button>
			</SignedOut>
			<SignedIn>
				<UserButton />
			</SignedIn>
		</div>
	);
}
