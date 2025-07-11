import {
	IconArrowLeft,
	IconBookmark,
	IconCopy,
	IconDownload,
	IconEdit,
	IconEye,
	IconLoader2,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { GeneratedContentWithRelations } from "@worker/types/gw";
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

export const Route = createFileRoute("/app/creation/contents/$contentId")({
	component: RouteComponent,
});

type ContentMode = "display" | "edit";

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { contentId } = Route.useParams();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
	const [contentMode, setContentMode] = useState<ContentMode>("display");
	const [editedContent, setEditedContent] = useState("");
	const [editedTitle, setEditedTitle] = useState("");
	const [userFeedback, setUserFeedback] = useState("");
	
	// Revision dialog state
	const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
	const [revisionRequest, setRevisionRequest] = useState("");
	const [isRevising, setIsRevising] = useState(false);
	
	const contentId_numeric = parseInt(contentId);
	const feedbackId = useId();
	const titleEditorId = useId();
	const contentEditorId = useId();
	const revisionRequestId = useId();

	// Fetch content data
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.getGeneratedContent.queryOptions({
			id: contentId_numeric,
		}),
	);

	const content = data;

	// Update content mutation
	const updateContentMutation = useMutation(
		trpc.contentRouter.updateGeneratedContent.mutationOptions({
			onSuccess: () => {
				toast.success("Content updated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGeneratedContent.queryKey({
						id: contentId_numeric,
					}),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGeneratedContents.queryKey(),
				});
				setContentMode("display");
			},
			onError: () => {
				toast.error("Failed to update content");
			},
		}),
	);

	// Delete content mutation
	const deleteContentMutation = useMutation(
		trpc.contentRouter.deleteGeneratedContent.mutationOptions({
			onSuccess: () => {
				toast.success("Content deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGeneratedContents.queryKey(),
				});
				navigate({ to: "/app/creation/contents" });
			},
			onError: () => {
				toast.error("Failed to delete content");
			},
		}),
	);

	// Revise content mutation
	const reviseContentMutation = useMutation(
		trpc.contentRouter.reviseContent.mutationOptions({
			onSuccess: () => {
				setContentMode("display");
				setRevisionDialogOpen(false);
				setRevisionRequest("");
				setIsRevising(false);
				toast.success("Content revised successfully");
				// Invalidate and refetch the content
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGeneratedContent.queryKey({
						id: contentId_numeric,
					}),
				});
			},
			onError: (error) => {
				setIsRevising(false);
				if (error.message === "MISSING_API_KEY") {
					toast.error("API key required. Please check your settings.");
				} else {
					toast.error("Failed to revise content");
				}
			},
		}),
	);

	// Update form state when content data loads
	useEffect(() => {
		if (content) {
			setEditedContent(content.content);
			setEditedTitle(content.prompt);
			setUserFeedback(content.userFeedBack || "");
		}
	}, [content]);

	const handleSaveEdit = () => {
		if (!content) return;

		updateContentMutation.mutate({
			id: content.id,
			content: editedContent,
			prompt: editedTitle,
		});
	};

	const handleToggleTraining = () => {
		if (!content) return;

		if (!content.ghostwriter) {
			toast.error(
				"Only writer-generated content can be saved as training data",
			);
			return;
		}

		if (!content.isTrainingData) {
			// If making it training data, show dialog for feedback
			setTrainingDialogOpen(true);
		} else {
			// If removing training data, just toggle
			updateContentMutation.mutate({
				id: content.id,
				isTrainingData: false,
			});
		}
	};

	const confirmTrainingDataSave = () => {
		if (!content) return;

		updateContentMutation.mutate({
			id: content.id,
			isTrainingData: true,
			userFeedBack: userFeedback.trim() || undefined,
		});
		setTrainingDialogOpen(false);
	};

	// Revision handlers
	const handleRequestRevision = () => {
		setRevisionRequest("");
		setRevisionDialogOpen(true);
	};

	const handleSubmitRevision = () => {
		if (!revisionRequest.trim() || !content) return;

		const contentToRevise = contentMode === "edit" ? editedContent : content.content;

		// Ensure we have the required profile IDs
		if (!content.psyProfile?.id || !content.writingProfile?.id) {
			toast.error("Missing profile information required for revision");
			return;
		}

		setIsRevising(true);
		reviseContentMutation.mutate({
			contentToRevise,
			revisionRequest: revisionRequest.trim(),
			psychologyProfileId: content.psyProfile.id,
			writingProfileId: content.writingProfile.id,
			personaProfileId: content.persona?.id,
			contentId: contentId_numeric,
		});
	};

	const handleDelete = () => {
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (!content) return;
		deleteContentMutation.mutate({ id: content.id });
	};

	const handleCopyToClipboard = async () => {
		if (!content) return;
		const contentToCopy =
			contentMode === "edit" ? editedContent : content.content;

		try {
			await navigator.clipboard.writeText(contentToCopy);
			toast.success("Content copied to clipboard");
		} catch (error) {
			console.error("Copy failed:", error);
			toast.error("Failed to copy content");
		}
	};

	const handleDownloadMarkdown = () => {
		if (!content) return;
		const contentToDownload =
			contentMode === "edit" ? editedContent : content.content;

		// Create sanitized filename from prompt
		const sanitizedPrompt = content.prompt
			.trim()
			.slice(0, 50)
			.replace(/[^a-z0-9]/gi, "-")
			.toLowerCase();
		const filename = `content-${sanitizedPrompt || "generated"}-${Date.now()}.md`;

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

		toast.success("Content downloaded as markdown file");
	};

	const handleBack = () => {
		navigate({ to: "/app/creation/contents" });
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

	const getGenerationSource = (content: GeneratedContentWithRelations) => {
		if (content.ghostwriter) {
			return `Writer: ${content.ghostwriter.name}`;
		}
		return `Custom: ${content.psyProfile?.name || "Unknown"} + ${content.writingProfile?.name || "Unknown"}`;
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

	if (error || !content) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						{error ? "Failed to load content." : "Content not found."}
					</p>
					<Button onClick={handleBack}>Back to Contents</Button>
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
					Back to Contents
				</Button>
				<div className="flex justify-between items-start">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-2">
							<h1 className="text-3xl font-bold line-clamp-2">
								{content.prompt}
							</h1>
							{content.isTrainingData && (
								<IconBookmark className="h-6 w-6 text-primary flex-shrink-0" />
							)}
						</div>
						<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
							<span>{formatDate(content.createdAt)}</span>
							<span>{getGenerationSource(content)}</span>
							{content.persona && <span>Persona: {content.persona.name}</span>}
						</div>
					</div>
					<div className="flex items-center gap-2 ml-8">
						{/* Actions Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									disabled={updateContentMutation.isPending || isRevising}
								>
									Actions
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{content.ghostwriter && (
									<DropdownMenuItem
										onClick={handleToggleTraining}
										disabled={updateContentMutation.isPending}
									>
										<IconBookmark className="h-4 w-4 mr-2" />
										{content.isTrainingData
											? "Remove From Training"
											: "Add To Training"}
									</DropdownMenuItem>
								)}
								<DropdownMenuItem 
									onClick={handleRequestRevision}
									disabled={!content.psyProfile?.id || !content.writingProfile?.id || isRevising}
								>
									<IconEdit className="h-4 w-4 mr-2" />
									Ask for Revision
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleCopyToClipboard}>
									<IconCopy className="h-4 w-4 mr-2" />
									Copy to Clipboard
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDownloadMarkdown}>
									<IconDownload className="h-4 w-4 mr-2" />
									Download as MD
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Delete Button - kept separate for prominence */}
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
							<ReactMarkdown>{content.content}</ReactMarkdown>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="edit" className="mt-6 space-y-4">
					<div className="space-y-4 max-w-2xl mx-auto">
						<div className="space-y-2">
							<Label htmlFor={titleEditorId}>Title</Label>
							<Input
								id={titleEditorId}
								value={editedTitle}
								onChange={(e) => setEditedTitle(e.target.value)}
								placeholder="Enter the title for this content..."
								className="font-mono text-sm"
							/>
						</div>
						
						<div className="space-y-2">
							<Label htmlFor={contentEditorId}>Content</Label>
							<Textarea
								id={contentEditorId}
								value={editedContent}
								onChange={(e) => setEditedContent(e.target.value)}
								className="min-h-[500px] font-mono text-sm resize-none"
							/>
							<p className="text-sm text-muted-foreground">
								Use markdown formatting to structure your content.
							</p>
						</div>
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
								disabled={updateContentMutation.isPending}
							>
								{updateContentMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Training Data Dialog */}
			<Dialog open={trainingDialogOpen} onOpenChange={setTrainingDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Save as Training Data</DialogTitle>
						<DialogDescription>
							Add feedback about this generated content to help improve future
							generations.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={feedbackId}>User Feedback (Optional)</Label>
							<Textarea
								id={feedbackId}
								value={userFeedback}
								onChange={(e) => setUserFeedback(e.target.value)}
								placeholder="What did you like or dislike about this content? How could it be improved?"
								className="min-h-[100px] resize-none"
							/>
							<p className="text-xs text-muted-foreground">
								This feedback will be used to improve future content generation.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setTrainingDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={confirmTrainingDataSave}
							disabled={updateContentMutation.isPending}
						>
							{updateContentMutation.isPending
								? "Saving..."
								: "Save as Training Data"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Content</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this generated content? This
							action cannot be undone.
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
							disabled={deleteContentMutation.isPending}
						>
							{deleteContentMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Revision Dialog */}
			<Dialog
				open={revisionDialogOpen}
				onOpenChange={(open) => !isRevising && setRevisionDialogOpen(open)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Ask for Revision</DialogTitle>
						<DialogDescription>
							Describe what changes you'd like to make to the content. The AI
							will revise it while maintaining the same writing style and voice.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={revisionRequestId}>Revision Instructions</Label>
							<Textarea
								id={revisionRequestId}
								value={revisionRequest}
								onChange={(e) => setRevisionRequest(e.target.value)}
								placeholder="e.g., Make it more formal, add more details about X, shorten the introduction..."
								className="min-h-[120px] resize-none"
								disabled={isRevising}
							/>
						</div>
						{isRevising && (
							<div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
								<IconLoader2 className="h-4 w-4 animate-spin" />
								<span>Revising content... This may take 15-30 seconds.</span>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRevisionDialogOpen(false)}
							disabled={isRevising}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmitRevision}
							disabled={
								reviseContentMutation.isPending || !revisionRequest.trim()
							}
						>
							{reviseContentMutation.isPending ? (
								<>
									<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
									Revising...
								</>
							) : (
								"Submit Revision"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
