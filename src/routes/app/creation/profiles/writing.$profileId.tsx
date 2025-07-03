import {
	IconArrowLeft,
	IconBrain,
	IconCopy,
	IconDownload,
	IconEdit,
	IconEye,
	IconLoader2,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/router";

export const Route = createFileRoute(
	"/app/creation/profiles/writing/$profileId",
)({
	component: RouteComponent,
});

type ContentMode = "display" | "edit";

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { profileId } = Route.useParams();
	const profileId_numeric = parseInt(profileId);

	// State
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
	const [contentMode, setContentMode] = useState<ContentMode>("display");
	const [editedContent, setEditedContent] = useState("");
	const [newProfileName, setNewProfileName] = useState("");
	const [modifications, setModifications] = useState("");

	// IDs for accessibility
	const contentEditorId = useId();
	const nameInputId = useId();
	const modificationsId = useId();

	// Fetch profile data
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.getWritingProfile.queryOptions({
			id: profileId_numeric,
		}),
	);

	const profile = data;

	// Update mutations
	const updateProfileMutation = useMutation(
		trpc.contentRouter.updateWritingProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Profile updated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getWritingProfile.queryKey({
						id: profileId_numeric,
					}),
				});
				setContentMode("display");
			},
			onError: () => {
				toast.error("Failed to update profile");
			},
		}),
	);

	// Delete mutation
	const deleteProfileMutation = useMutation(
		trpc.contentRouter.deleteWritingProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Profile deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listWritingProfiles.queryKey(),
				});
				navigate({ to: "/app/creation/profiles" });
			},
			onError: () => {
				toast.error("Failed to delete profile");
			},
		}),
	);

	// Generate new profile mutation
	const generateProfileMutation = useMutation(
		trpc.contentRouter.modifyWritingProfile.mutationOptions({
			onSuccess: (data) => {
				toast.success("New profile generated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listWritingProfiles.queryKey(),
				});
				// Close the dialog
				setGenerateDialogOpen(false);
				// Navigate to the new profile
				navigate({
					to: "/app/creation/profiles/writing/$profileId",
					params: { profileId: data.id.toString() },
				});
			},
			onError: (error) => {
				if (error.message === "MISSING_API_KEY") {
					toast.error("API key required. Please check your settings.");
				} else {
					toast.error("Failed to generate new profile");
				}
				// Close dialog on error too
				setGenerateDialogOpen(false);
			},
		}),
	);

	// Update form state when profile data loads
	useEffect(() => {
		if (profile) {
			setEditedContent(profile.content);
		}
	}, [profile]);

	const handleSaveEdit = () => {
		if (!profile) return;

		updateProfileMutation.mutate({
			id: profile.id,
			name: profile.name,
			content: editedContent,
		});
	};

	const handleDelete = () => {
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (!profile) return;
		deleteProfileMutation.mutate({ id: profile.id });
	};

	const handleGenerateNew = () => {
		setNewProfileName("");
		setModifications("");
		setGenerateDialogOpen(true);
	};

	const confirmGenerateNew = () => {
		if (!profile || !newProfileName.trim() || !modifications.trim()) return;

		generateProfileMutation.mutate({
			profileId: profile.id,
			newName: newProfileName.trim(),
			modifications: modifications.trim(),
		});
	};

	const handleCopyToClipboard = async () => {
		if (!profile) return;
		const contentToCopy =
			contentMode === "edit" ? editedContent : profile.content;

		try {
			await navigator.clipboard.writeText(contentToCopy);
			toast.success("Profile copied to clipboard");
		} catch (error) {
			console.error("Copy failed:", error);
			toast.error("Failed to copy profile");
		}
	};

	const handleDownloadMarkdown = () => {
		if (!profile) return;
		const contentToDownload =
			contentMode === "edit" ? editedContent : profile.content;

		// Create sanitized filename
		const sanitizedName = profile.name
			.trim()
			.slice(0, 50)
			.replace(/[^a-z0-9]/gi, "-")
			.toLowerCase();
		const filename = `writing-profile-${sanitizedName || "profile"}-${Date.now()}.md`;

		// Create blob and download
		const blob = new Blob([contentToDownload], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success("Profile downloaded as markdown file");
	};

	const handleBack = () => {
		navigate({ to: "/app/creation/profiles" });
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<Skeleton className="h-10 w-32 mb-6" />
				<Skeleton className="h-8 w-48 mb-2" />
				<Skeleton className="h-4 w-64 mb-6" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						{error ? "Failed to load profile." : "Profile not found."}
					</p>
					<Button onClick={handleBack}>Back to Profiles</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-2 lg:p-4">
			{/* Header */}
			<div className="mb-6">
				<Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
					<IconArrowLeft className="h-4 w-4 mr-2" />
					Back to Profiles
				</Button>
				<div className="flex justify-between items-start">
					<div className="flex-1 min-w-0">
						<h1 className="text-3xl font-bold line-clamp-2">{profile.name}</h1>
						<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
							<span>Writing Style Profile</span>
							<span>{formatDate(profile.createdAt)}</span>
							{profile.ghostwriter && (
								<span>Writer: {profile.ghostwriter.name}</span>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2 ml-4">
						<Button variant="outline" size="sm" onClick={handleGenerateNew}>
							<IconBrain className="h-4 w-4 mr-2" />
							Generate New
						</Button>
						<Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
							<IconCopy className="h-4 w-4 mr-2" />
							Copy
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownloadMarkdown}
						>
							<IconDownload className="h-4 w-4 mr-2" />
							Download
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleDelete}
							className="text-destructive"
						>
							<IconTrash className="h-4 w-4 mr-2" />
							Delete
						</Button>
					</div>
				</div>
			</div>

			{/* Content Tabs */}
			<Tabs
				value={contentMode}
				onValueChange={(value) => setContentMode(value as ContentMode)}
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="display">
						<IconEye className="h-4 w-4 mr-2" />
						Display
					</TabsTrigger>
					<TabsTrigger value="edit">
						<IconEdit className="h-4 w-4 mr-2" />
						Edit
					</TabsTrigger>
				</TabsList>

				<TabsContent value="display" className="mt-6">
					<div className="rounded-lg border bg-background p-8">
						<div className="prose prose-stone dark:prose-invert max-w-2xl mx-auto">
							<ReactMarkdown>{profile.content}</ReactMarkdown>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="edit" className="mt-6 space-y-4">
					<div className="space-y-2 max-w-2xl mx-auto">
						<Label htmlFor={contentEditorId}>Profile Content</Label>
						<Textarea
							id={contentEditorId}
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							className="min-h-[500px] font-mono text-sm resize-none"
						/>
						<p className="text-sm text-muted-foreground">
							Use markdown formatting to structure your profile content.
						</p>
					</div>

					{/* Save Button */}
					<div className="flex justify-end pt-4 border-t">
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => setContentMode("display")}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveEdit}
								disabled={updateProfileMutation.isPending}
							>
								{updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Generate New Profile Dialog */}
			<Dialog
				open={generateDialogOpen}
				onOpenChange={
					generateProfileMutation.isPending ? undefined : setGenerateDialogOpen
				}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Generate New Profile</DialogTitle>
						<DialogDescription>
							Create a new writing style profile based on this one with your
							specified modifications. This will take 15-30 seconds.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={nameInputId}>New Profile Name</Label>
							<Input
								id={nameInputId}
								value={newProfileName}
								onChange={(e) => setNewProfileName(e.target.value)}
								placeholder="Enter name for the new profile"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={modificationsId}>Modifications</Label>
							<Textarea
								id={modificationsId}
								value={modifications}
								onChange={(e) => setModifications(e.target.value)}
								placeholder="Describe how you want to modify this writing style (e.g., 'Make it more conversational and casual' or 'Adapt for academic writing style')"
								className="min-h-[120px] max-h-[350px] overflow-y-auto"
							/>
							<p className="text-xs text-muted-foreground">
								Be specific about the stylistic changes you want. The AI will
								preserve the analytical structure while adapting the style
								descriptions.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setGenerateDialogOpen(false)}
							disabled={generateProfileMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={confirmGenerateNew}
							disabled={
								generateProfileMutation.isPending ||
								!newProfileName.trim() ||
								!modifications.trim()
							}
						>
							{generateProfileMutation.isPending ? (
								<>
									<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<IconBrain className="h-4 w-4 mr-2" />
									Generate New Profile
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Profile</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{profile.name}"? This will remove
							the profile from any associated writers and content. This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDelete}
							disabled={deleteProfileMutation.isPending}
						>
							{deleteProfileMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
