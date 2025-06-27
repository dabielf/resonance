import { IconAlertSquareRounded, IconCheck } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/settings")({
	component: RouteComponent,
});

function RouteComponent() {
	const [geminiApiKey, setGeminiApiKey] = useState("");
	const inputId = useId();
	const queryClient = useQueryClient();

	// Fetch current user settings using react-query
	const { data: userSettings, isLoading: isLoadingSettings } = useQuery(
		trpc.userSettingsRouter.getUserSettings.queryOptions(),
	);

	// Mutation to save new API key using react-query
	const saveGeminiKeyMutation = useMutation(
		trpc.userSettingsRouter.setUserGeminiKey.mutationOptions({
			onSuccess: () => {
				toast.success("Gemini API key saved securely!");
				setGeminiApiKey(""); // Clear input after successful save
				// Invalidate and refetch user settings to update the UI
				queryClient.invalidateQueries({
					queryKey: trpc.userSettingsRouter.getUserSettings.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(`Failed to save API key: ${error.message}`);
			},
		}),
	);

	const handleSaveGeminiKey = (e: React.FormEvent) => {
		e.preventDefault();
		if (!geminiApiKey.trim()) {
			toast.error("Please enter a valid API key");
			return;
		}
		saveGeminiKeyMutation.mutate({ geminiApiKey: geminiApiKey.trim() });
	};

	const hasGeminiKey = userSettings?.hasGeminiApiKey;

	return (
		<div className="flex flex-col gap-6 overflow-auto p-6">
			<div>
				<h1 className="text-2xl font-bold">Settings</h1>
				<p className="text-muted-foreground">
					Manage your account and API configurations
				</p>
			</div>

			<Separator />

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						API Keys
						{isLoadingSettings ? (
							<Badge variant="secondary">Loading...</Badge>
						) : hasGeminiKey ? (
							<Badge variant="default">
								<IconCheck /> Configured
							</Badge>
						) : (
							<Badge variant="destructive">
								<IconAlertSquareRounded /> Not Set
							</Badge>
						)}
					</CardTitle>
					<CardDescription>
						Configure your AI service API keys. All keys are encrypted and
						stored securely.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Gemini API Key Section */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label htmlFor={inputId} className="text-sm font-medium">
								Google Gemini API Key
							</Label>
							{hasGeminiKey && (
								<span className="text-xs text-muted-foreground flex items-center gap-1">
									<IconCheck className="!size-4" /> Configured and encrypted
								</span>
							)}
						</div>

						<form onSubmit={handleSaveGeminiKey} className="flex gap-2">
							<Input
								id={inputId}
								type="password"
								placeholder="Enter your Gemini API key"
								value={geminiApiKey}
								onChange={(e) => setGeminiApiKey(e.target.value)}
								disabled={saveGeminiKeyMutation.isPending}
								className="flex-1"
							/>
							<Button
								type="submit"
								disabled={
									saveGeminiKeyMutation.isPending || !geminiApiKey.trim()
								}
							>
								{saveGeminiKeyMutation.isPending
									? "Saving..."
									: hasGeminiKey
										? "Update"
										: "Save"}
							</Button>
						</form>

						<p className="text-xs text-muted-foreground">
							Your API key will be encrypted using bank-level security before
							storage. Get your key from{" "}
							<a
								href="https://makersuite.google.com/app/apikey"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								Google AI Studio
							</a>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
