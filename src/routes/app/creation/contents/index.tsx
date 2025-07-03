import {
	IconBookmark,
	IconCopy,
	IconDownload,
	IconEye,
	IconPlus,
	IconSearch,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/router";
import type { GeneratedContentWithRelations } from "@worker/types/gw";

export const Route = createFileRoute("/app/creation/contents/")({
	component: RouteComponent,
});

type FilterMode = "all" | "writer" | "custom" | "training";

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = useState("");
	const [filterMode, setFilterMode] = useState<FilterMode>("all");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [contentToDelete, setContentToDelete] = useState<GeneratedContentWithRelations | null>(null);

	// Fetch generated contents
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.listGeneratedContents.queryOptions(),
	);

	const contents = data || [];

	// Delete content mutation
	const deleteContentMutation = useMutation(
		trpc.contentRouter.deleteGeneratedContent.mutationOptions({
			onSuccess: () => {
				toast.success("Content deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGeneratedContents.queryKey(),
				});
				setDeleteDialogOpen(false);
				setContentToDelete(null);
			},
			onError: () => {
				toast.error("Failed to delete content");
			},
		}),
	);

	// Update content mutation (for training data toggle)
	const updateContentMutation = useMutation(
		trpc.contentRouter.updateGeneratedContent.mutationOptions({
			onSuccess: () => {
				toast.success("Content updated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGeneratedContents.queryKey(),
				});
			},
			onError: () => {
				toast.error("Failed to update content");
			},
		}),
	);

	// Filter and search contents
	const filteredContents = contents.filter((content) => {
		// Search filter
		const matchesSearch =
			searchTerm === "" ||
			content.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
			content.content.toLowerCase().includes(searchTerm.toLowerCase());

		// Mode filter
		let matchesMode = true;
		switch (filterMode) {
			case "writer":
				matchesMode = !!content.ghostwriter;
				break;
			case "custom":
				matchesMode = !content.ghostwriter;
				break;
			case "training":
				matchesMode = content.isTrainingData;
				break;
			default:
				matchesMode = true;
		}

		return matchesSearch && matchesMode;
	});

	const handleDelete = (content: GeneratedContentWithRelations) => {
		setContentToDelete(content);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (contentToDelete) {
			deleteContentMutation.mutate({ id: contentToDelete.id });
		}
	};

	const handleToggleTraining = (content: GeneratedContentWithRelations) => {
		if (!content.ghostwriter) {
			toast.error("Only writer-generated content can be saved as training data");
			return;
		}

		updateContentMutation.mutate({
			id: content.id,
			isTrainingData: !content.isTrainingData,
		});
	};

	const handleCopyToClipboard = async (content: GeneratedContentWithRelations) => {
		try {
			await navigator.clipboard.writeText(content.content);
			toast.success("Content copied to clipboard");
		} catch (error) {
			console.error("Copy failed:", error);
			toast.error("Failed to copy content");
		}
	};

	const handleDownloadMarkdown = (content: GeneratedContentWithRelations) => {
		// Create sanitized filename from prompt
		const sanitizedPrompt = content.prompt
			.trim()
			.slice(0, 50)
			.replace(/[^a-z0-9]/gi, "-")
			.toLowerCase();
		const filename = `content-${sanitizedPrompt || "generated"}-${Date.now()}.md`;

		// Create blob and download
		const blob = new Blob([content.content], { type: "text/markdown" });
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
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

	const truncateContent = (text: string, maxLength: number = 150) => {
		if (text.length <= maxLength) return text;
		return `${text.substring(0, maxLength)}...`;
	};

	const handleViewContent = (contentId: number) => {
		navigate({
			to: "/app/creation/contents/$contentId",
			params: { contentId: contentId.toString() },
		});
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-2 lg:p-4 space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-48 mb-2" />
						<Skeleton className="h-4 w-64" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>

				<div className="flex gap-4">
					<Skeleton className="h-10 flex-1" />
					<Skeleton className="h-10 w-32" />
				</div>

				<div className="divide-y divide-border rounded-lg border bg-background">
					{[1, 2, 3, 4, 5].map((key) => (
						<div key={key} className="flex items-center justify-between px-6 py-4">
							<div className="flex-1 min-w-0">
								<Skeleton className="h-5 w-32 mb-2" />
								<Skeleton className="h-4 w-48 mb-1" />
								<Skeleton className="h-3 w-24" />
							</div>
							<div className="flex items-center gap-2 ml-4">
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-8 w-16" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						Failed to load generated contents. Please try again.
					</p>
					<Button onClick={() => window.location.reload()}>Retry</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-2 lg:p-4 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Generated Contents</h1>
					<p className="text-muted-foreground mt-1">
						Manage your AI-generated content and training data
					</p>
				</div>
				<Link to="/app/creation/create">
					<Button>
						<IconPlus className="h-4 w-4 mr-2" />
						Generate Content
					</Button>
				</Link>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search prompts and content..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Select value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)}>
					<SelectTrigger className="w-full sm:w-40">
						<SelectValue placeholder="Filter by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Content</SelectItem>
						<SelectItem value="writer">Writer Mode</SelectItem>
						<SelectItem value="custom">Custom Mode</SelectItem>
						<SelectItem value="training">Training Data</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Content List */}
			{filteredContents.length === 0 ? (
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						{searchTerm || filterMode !== "all"
							? "No content matches your search criteria."
							: "No generated content yet."}
					</p>
					{(!searchTerm && filterMode === "all") && (
						<Link to="/app/creation/create">
							<Button>
								<IconPlus className="h-4 w-4 mr-2" />
								Generate Your First Content
							</Button>
						</Link>
					)}
				</div>
			) : (
				<div className="divide-y divide-border rounded-lg border bg-background">
					{filteredContents.map((content) => (
						<div
							key={content.id}
							className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-2">
									<h3 className="text-base font-medium leading-none line-clamp-1">
										{content.prompt}
									</h3>
									{content.isTrainingData && (
										<IconBookmark className="h-4 w-4 text-primary flex-shrink-0" />
									)}
								</div>
								<p className="text-sm text-muted-foreground mb-2 line-clamp-2">
									{truncateContent(content.content)}
								</p>
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<span>{formatDate(content.createdAt)}</span>
									<span>{getGenerationSource(content)}</span>
									{content.persona && (
										<span>Persona: {content.persona.name}</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2 ml-4">
								<Button 
									size="sm" 
									variant="outline" 
									onClick={() => handleViewContent(content.id)}
								>
									<IconEye className="h-4 w-4 mr-1.5" />
									View
								</Button>
								{content.ghostwriter && (
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleToggleTraining(content)}
										disabled={updateContentMutation.isPending}
									>
										<IconBookmark className="h-4 w-4 mr-1.5" />
										{content.isTrainingData ? "Remove Training" : "Add Training"}
									</Button>
								)}
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleCopyToClipboard(content)}
								>
									<IconCopy className="h-4 w-4 mr-1.5" />
									Copy
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleDownloadMarkdown(content)}
								>
									<IconDownload className="h-4 w-4 mr-1.5" />
									Download
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleDelete(content)}
								>
									<IconTrash className="h-4 w-4 mr-1.5" />
									Delete
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Content</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this generated content? This action
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
							disabled={deleteContentMutation.isPending}
						>
							{deleteContentMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
