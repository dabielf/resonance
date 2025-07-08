import {
	IconArrowLeft,
	IconBrain,
	IconChevronDown,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/profiles/psy/$profileId")({
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
	const [modifyMode, setModifyMode] = useState<'current' | 'new'>('current');

	// IDs for accessibility
	const contentEditorId = useId();
	const nameInputId = useId();
	const modificationsId = useId();

	// Fetch profile data
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.getPsyProfile.queryOptions({
			id: profileId_numeric,
		}),
	);

	const profile = data;

	// Update mutations
	const updateProfileMutation = useMutation(
		trpc.contentRouter.updatePsyProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Profile updated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getPsyProfile.queryKey({
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
		trpc.contentRouter.deletePsyProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Profile deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPsyProfiles.queryKey(),
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
		trpc.contentRouter.modifyPsyProfile.mutationOptions({
			onSuccess: (data) => {
				// ALWAYS invalidate list query first as content has changed
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPsyProfiles.queryKey(),
				});
				
				// Close dialog
				setGenerateDialogOpen(false);
				
				// Handle mode-specific logic
				if (modifyMode === 'current') {
					toast.success("Profile modified successfully");
					// Also invalidate current profile query to refresh the content
					queryClient.invalidateQueries({
						queryKey: trpc.contentRouter.getPsyProfile.queryKey({
							id: profileId_numeric,
						}),
					});
				} else {
					toast.success("New profile generated successfully");
					// Navigate to the new profile
					navigate({
						to: "/app/creation/profiles/psy/$profileId",
						params: { profileId: data.id.toString() },
					});
				}
			},
			onError: (error) => {
				if (error.message === "MISSING_API_KEY") {
					toast.error("API key required. Please check your settings.");
				} else {
					toast.error(modifyMode === 'current' ? "Failed to modify profile" : "Failed to generate new profile");
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

	const handleModifyCurrent = () => {
		setModifyMode('current');
		setModifications("");
		setGenerateDialogOpen(true);
	};

	const handleGenerateNew = () => {
		setModifyMode('new');
		setNewProfileName("");
		setModifications("");
		setGenerateDialogOpen(true);
	};

	const confirmGenerateNew = () => {
		if (!profile || !modifications.trim()) return;
		if (modifyMode === 'new' && !newProfileName.trim()) return;

		generateProfileMutation.mutate({
			profileId: profile.id,
			newName: modifyMode === 'new' ? newProfileName.trim() : undefined,
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
		const filename = `psy-profile-${sanitizedName || "profile"}-${Date.now()}.md`;

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
							<span>Psychology Profile</span>
							<span>{formatDate(profile.createdAt)}</span>
							{profile.ghostwriter && (
								<span>Writer: {profile.ghostwriter.name}</span>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2 ml-4">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									Actions
									<IconChevronDown className="h-4 w-4 ml-1" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleModifyCurrent}>
									<IconEdit className="h-4 w-4 mr-2" />
									Modify Profile
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleGenerateNew}>
									<IconBrain className="h-4 w-4 mr-2" />
									Generate New Profile
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleCopyToClipboard}>
									<IconCopy className="h-4 w-4 mr-2" />
									Copy to Clipboard
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDownloadMarkdown}>
									<IconDownload className="h-4 w-4 mr-2" />
									Download as Markdown
								</DropdownMenuItem>
								<DropdownMenuItem 
									onClick={handleDelete}
									className="text-destructive"
								>
									<IconTrash className="h-4 w-4 mr-2" />
									Delete Profile
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
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
						<DialogTitle>
							{modifyMode === 'current' ? 'Modify Profile' : 'Generate New Profile'}
						</DialogTitle>
						<DialogDescription>
							{modifyMode === 'current' 
								? 'Describe how you want to modify this profile. The AI will update it while preserving the core structure.'
								: 'Create a new psychology profile based on this one with your specified modifications. This will take 15-30 seconds.'}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{modifyMode === 'new' && (
							<div className="space-y-2">
								<Label htmlFor={nameInputId}>New Profile Name</Label>
								<Input
									id={nameInputId}
									value={newProfileName}
									onChange={(e) => setNewProfileName(e.target.value)}
									placeholder="Enter name for the new profile"
								/>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor={modificationsId}>Modifications</Label>
							<Textarea
								id={modificationsId}
								value={modifications}
								onChange={(e) => setModifications(e.target.value)}
								placeholder="Describe how you want to modify this profile (e.g., 'Make it more focused on creativity and innovation' or 'Adapt for technical writing style')"
								className="min-h-[120px] max-h-[350px] overflow-y-auto"
							/>
							<p className="text-xs text-muted-foreground">
								Be specific about the changes you want. The AI will preserve the
								psychological structure while adapting the content.
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
								!modifications.trim() ||
								(modifyMode === 'new' && !newProfileName.trim())
							}
						>
							{generateProfileMutation.isPending ? (
								<>
									<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
									{modifyMode === 'current' ? 'Modifying...' : 'Generating...'}
								</>
							) : (
								<>
									{modifyMode === 'current' ? (
										<>
											<IconEdit className="h-4 w-4 mr-2" />
											Modify Profile
										</>
									) : (
										<>
											<IconBrain className="h-4 w-4 mr-2" />
											Generate New Profile
										</>
									)}
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
