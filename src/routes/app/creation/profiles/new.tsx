import { IconArrowLeft } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/profiles/new")({
	component: RouteComponent,
});

type ProfileType = "psychology" | "writing";

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [profileType, setProfileType] = useState<ProfileType>("psychology");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [content, setContent] = useState("");
	const nameId = useId();
	const descriptionId = useId();
	const contentId = useId();

	// Create profile mutations
	const savePsyProfileMutation = useMutation(
		trpc.contentRouter.savePsyProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Psychology profile created successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPsyProfiles.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getUserData.queryKey(),
				});
				navigate({ to: "/app/creation/profiles" });
			},
			onError: (error) => {
				toast.error("Failed to create psychology profile");
				console.error("Error creating psychology profile:", error);
			},
		}),
	);

	const saveWritingProfileMutation = useMutation(
		trpc.contentRouter.saveWritingProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Writing profile created successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listWritingProfiles.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getUserData.queryKey(),
				});
				navigate({ to: "/app/creation/profiles" });
			},
			onError: (error) => {
				toast.error("Failed to create writing profile");
				console.error("Error creating writing profile:", error);
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Please provide a name for the profile");
			return;
		}

		if (!content.trim()) {
			toast.error("Please provide content for the profile");
			return;
		}

		const profileData = {
			name: name.trim(),
			content: content.trim(),
		};

		if (profileType === "psychology") {
			savePsyProfileMutation.mutate(profileData);
		} else {
			saveWritingProfileMutation.mutate(profileData);
		}
	};

	const handleCancel = () => {
		navigate({ to: "/app/creation/profiles" });
	};

	const isLoading = savePsyProfileMutation.isPending || saveWritingProfileMutation.isPending;

	return (
		<div className="container mx-auto p-2 lg:p-4 max-w-3xl">
			{/* Header */}
			<div className="mb-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleCancel}
					className="mb-4"
				>
					<IconArrowLeft className="h-4 w-4 mr-2" />
					Back to Profiles
				</Button>
				<h1 className="text-3xl font-bold">Create New Profile</h1>
				<p className="text-muted-foreground mt-1">
					Create a new psychological or writing style profile
				</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Profile Type Selection */}
				<div className="space-y-2">
					<Label>Profile Type *</Label>
					<Tabs
						value={profileType}
						onValueChange={(value) => setProfileType(value as ProfileType)}
					>
						<TabsList className="grid w-full max-w-md grid-cols-2">
							<TabsTrigger value="psychology">Psychology</TabsTrigger>
							<TabsTrigger value="writing">Writing Style</TabsTrigger>
						</TabsList>
					</Tabs>
					<p className="text-sm text-muted-foreground">
						Choose whether this is a psychological profile or writing style profile
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor={nameId}>Name *</Label>
					<Input
						id={nameId}
						placeholder={
							profileType === "psychology"
								? "e.g., Analytical Thinker, Creative Visionary, Strategic Leader"
								: "e.g., Technical Writer, Conversational Blogger, Academic Researcher"
						}
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="text-base"
						required
					/>
					<p className="text-sm text-muted-foreground">
						Give your {profileType} profile a descriptive name
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor={descriptionId}>Description (Optional)</Label>
					<Textarea
						id={descriptionId}
						placeholder={
							profileType === "psychology"
								? "e.g., A methodical approach to problem-solving with emphasis on data-driven insights"
								: "e.g., Clear, concise writing style focused on technical accuracy and accessibility"
						}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="min-h-[80px] resize-none"
					/>
					<p className="text-sm text-muted-foreground">
						Brief description of this {profileType} profile's characteristics
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor={contentId}>Profile Content *</Label>
					<Textarea
						id={contentId}
						placeholder={
							profileType === "psychology"
								? "Define the psychological characteristics, thinking patterns, decision-making style, communication preferences, etc. You can use markdown formatting."
								: "Define the writing style, tone, vocabulary, sentence structure, formatting preferences, etc. You can use markdown formatting."
						}
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className="min-h-[300px] font-mono text-sm"
						required
					/>
					<p className="text-sm text-muted-foreground">
						Detailed definition of the {profileType} profile. This will be used to guide AI
						content generation.
					</p>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button
						type="button"
						variant="outline"
						onClick={handleCancel}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Creating..." : `Create ${profileType === "psychology" ? "Psychology" : "Writing"} Profile`}
					</Button>
				</div>
			</form>
		</div>
	);
}
