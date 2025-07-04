import {
	IconEye,
	IconLoader2,
	IconPlus,
	IconTrash,
	IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useState } from "react";
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

export const Route = createFileRoute("/app/creation/resources/")({
	component: ResourcesPage,
});

export default function ResourcesPage() {
	const queryClient = useQueryClient();

	// State for dialogs
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [resourceToDelete, setResourceToDelete] = useState<{
		id: number;
		title: string;
	} | null>(null);

	const titleId = useId();
	const contentId = useId();
	const pdfFileId = useId();
	const epubFileId = useId();

	// State for add resource form
	const [addMode, setAddMode] = useState<"text" | "pdf" | "epub">("text");
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [file, setFile] = useState<File | null>(null);

	// Fetch resources
	const {
		data: resources,
		isLoading,
		error,
	} = useQuery(trpc.resourceRouter.listResources.queryOptions());

	// Create resource mutations
	const createTextResourceMutation = useMutation(
		trpc.resourceRouter.createResource.mutationOptions({
			onSuccess: () => {
				toast.success("Resource created successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.listResources.queryKey(),
				});
				setAddDialogOpen(false);
				resetForm();
			},
			onError: (error) => {
				toast.error("Failed to create resource");
				console.error("Create resource failed:", error);
			},
		}),
	);

	const createPdfResourceMutation = useMutation(
		trpc.resourceRouter.uploadPdfResource.mutationOptions({
			onSuccess: () => {
				toast.success("PDF resource created successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.listResources.queryKey(),
				});
				setAddDialogOpen(false);
				resetForm();
			},
			onError: (error) => {
				toast.error("Failed to process PDF");
				console.error("PDF upload failed:", error);
			},
		}),
	);

	const createEpubResourceMutation = useMutation(
		trpc.resourceRouter.uploadEpubResource.mutationOptions({
			onSuccess: () => {
				toast.success("EPUB resource created successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.listResources.queryKey(),
				});
				setAddDialogOpen(false);
				resetForm();
			},
			onError: (error) => {
				toast.error("Failed to process EPUB");
				console.error("EPUB upload failed:", error);
			},
		}),
	);

	// Delete resource mutation
	const deleteResourceMutation = useMutation(
		trpc.resourceRouter.deleteResource.mutationOptions({
			onSuccess: () => {
				toast.success("Resource deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.listResources.queryKey(),
				});
				setDeleteDialogOpen(false);
				setResourceToDelete(null);
			},
			onError: () => {
				toast.error("Failed to delete resource");
			},
		}),
	);

	// Form handlers
	const resetForm = () => {
		setTitle("");
		setContent("");
		setFile(null);
		setAddMode("text");
	};

	const handleAddResource = () => {
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}

		if (addMode === "text") {
			if (!content.trim()) {
				toast.error("Content is required");
				return;
			}
			createTextResourceMutation.mutate({
				title: title.trim(),
				content: content.trim(),
			});
		} else if (addMode === "pdf") {
			if (!file) {
				toast.error("PDF file is required");
				return;
			}
			// Create FormData with file and title
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', title.trim());
			createPdfResourceMutation.mutate(formData);
		} else if (addMode === "epub") {
			if (!file) {
				toast.error("EPUB file is required");
				return;
			}
			// Create FormData with file and title
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', title.trim());
			createEpubResourceMutation.mutate(formData);
		}
	};

	const handleDelete = (resource: { id: number; title: string }) => {
		setResourceToDelete(resource);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (resourceToDelete) {
			deleteResourceMutation.mutate({ id: resourceToDelete.id });
		}
	};

	const isLoading_Any =
		createTextResourceMutation.isPending ||
		createPdfResourceMutation.isPending ||
		createEpubResourceMutation.isPending;

	// Loading state
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
				<div className="divide-y divide-border rounded-lg border bg-background">
					{[1, 2, 3].map((key) => (
						<div
							key={key}
							className="flex items-center justify-between px-6 py-4"
						>
							<div className="flex-1">
								<Skeleton className="h-5 w-32 mb-2" />
								<Skeleton className="h-4 w-48" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-9 w-20" />
								<Skeleton className="h-9 w-20" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						Failed to load resources. Please try again.
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
					<h1 className="text-3xl font-bold">Resources</h1>
					<p className="text-muted-foreground mt-1">
						Manage your books, documents and other content resources
					</p>
				</div>
				<Button onClick={() => setAddDialogOpen(true)}>
					<IconPlus className="h-4 w-4 mr-2" />
					Add Resource
				</Button>
			</div>

			{/* Resources List */}
			{!resources || resources.length === 0 ? (
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						No resources found. Add your first resource to get started.
					</p>
					<Button onClick={() => setAddDialogOpen(true)}>
						<IconPlus className="h-4 w-4 mr-2" />
						Add Resource
					</Button>
				</div>
			) : (
				<div className="divide-y divide-border rounded-lg border bg-background">
					{resources.map((resource) => (
						<div
							key={resource.id}
							className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
						>
							<div className="flex-1 min-w-0">
								<h3 className="text-base font-medium leading-none">
									{resource.title}
								</h3>
								<div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
									<span>
										{resource.insightCount}{" "}
										{resource.insightCount === 1 ? "insight" : "insights"}
									</span>
									<span>
										Added {new Date(resource.createdAt).toLocaleDateString()}
									</span>
									{resource.author && <span>by {resource.author}</span>}
								</div>
							</div>
							<div className="flex items-center gap-2 ml-4">
								<Link
									to="/app/creation/resources/$resourceId"
									params={{ resourceId: resource.id.toString() }}
								>
									<Button size="sm" variant="outline">
										<IconEye className="h-4 w-4 mr-1.5" />
										View
									</Button>
								</Link>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleDelete(resource)}
								>
									<IconTrash className="h-4 w-4 mr-1.5" />
									Delete
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add Resource Dialog */}
			<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add Resource</DialogTitle>
						<DialogDescription>
							Add a new resource from text, PDF, or EPUB file.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<Tabs
							value={addMode}
							onValueChange={(value) =>
								setAddMode(value as "text" | "pdf" | "epub")
							}
						>
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="text">Plain Text</TabsTrigger>
								<TabsTrigger value="pdf">PDF Upload</TabsTrigger>
								<TabsTrigger value="epub">EPUB Upload</TabsTrigger>
							</TabsList>

							<div className="mt-4 space-y-4">
								<div>
									<Label htmlFor={titleId}>Title</Label>
									<Input
										id={titleId}
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Enter resource title"
									/>
								</div>

								<TabsContent value="text" className="mt-0">
									<div>
										<Label htmlFor={contentId}>Content</Label>
										<Textarea
											id={contentId}
											value={content}
											onChange={(e) => setContent(e.target.value)}
											placeholder="Paste your text content here..."
											className="min-h-[200px] resize-none"
										/>
									</div>
								</TabsContent>

								<TabsContent value="pdf" className="mt-0">
									<div>
										<Label htmlFor={pdfFileId}>PDF File</Label>
										<Input
											id={pdfFileId}
											type="file"
											accept=".pdf"
											onChange={(e) => setFile(e.target.files?.[0] || null)}
										/>
										<p className="text-xs text-muted-foreground mt-1">
											Upload a PDF file to extract text content automatically.
										</p>
									</div>
								</TabsContent>

								<TabsContent value="epub" className="mt-0">
									<div>
										<Label htmlFor={epubFileId}>EPUB File</Label>
										<Input
											id={epubFileId}
											type="file"
											accept=".epub"
											onChange={(e) => setFile(e.target.files?.[0] || null)}
										/>
										<p className="text-xs text-muted-foreground mt-1">
											Upload an EPUB file to extract text content automatically.
										</p>
									</div>
								</TabsContent>
							</div>
						</Tabs>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setAddDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddResource} disabled={isLoading_Any}>
							{isLoading_Any ? (
								<>
									<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
									{addMode === "text" ? "Creating..." : "Processing..."}
								</>
							) : (
								<>
									<IconUpload className="h-4 w-4 mr-2" />
									Add Resource
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
						<DialogTitle>Delete Resource</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{resourceToDelete?.title}"? This
							will also delete all insights extracted from this resource. This
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
							disabled={deleteResourceMutation.isPending}
						>
							{deleteResourceMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
