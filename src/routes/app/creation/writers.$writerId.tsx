import {
	IconArrowLeft,
	IconBrain,
	IconCopy,
	IconDownload,
	IconEdit,
	IconEye,
	IconLoader2,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
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

export const Route = createFileRoute("/app/creation/writers/$writerId")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { writerId } = Route.useParams();
	const id = parseInt(writerId);

	// State
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteContentDialogOpen, setDeleteContentDialogOpen] = useState(false);
	const [contentToDelete, setContentToDelete] = useState<number | null>(null);
	const [addContentDialogOpen, setAddContentDialogOpen] = useState(false);
	const [newContent, setNewContent] = useState("");
	const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
	const [psyProfileName, setPsyProfileName] = useState("");
	const [writingProfileName, setWritingProfileName] = useState("");
	const [profileDialogOpen, setProfileDialogOpen] = useState(false);
	const [profileToView, setProfileToView] = useState<{
		type: "psy" | "writing";
		name: string;
		content: string;
	} | null>(null);
	const [extractPersonaDialogOpen, setExtractPersonaDialogOpen] =
		useState(false);
	const [personaSelectionDialogOpen, setPersonaSelectionDialogOpen] =
		useState(false);
	const [extractPersonaName, setExtractPersonaName] = useState("");
	const [setAsBasePersona, setSetAsBasePersona] = useState(true);

	// IDs for form fields
	const newContentId = useId();
	const psyProfileNameId = useId();
	const writingProfileNameId = useId();
	const extractPersonaNameId = useId();
	const basePersonaId = useId();

	// Fetch writer data
	const {
		data: writer,
		isLoading,
		error,
	} = useQuery(trpc.contentRouter.getGhostwriter.queryOptions({ id }));

	// Fetch user personas for selection
	const { data: userPersonas } = useQuery(
		trpc.contentRouter.listPersonas.queryOptions(),
	);

	// Mutations
	const deleteWriterMutation = useMutation(
		trpc.contentRouter.deleteGhostwriter.mutationOptions({
			onSuccess: () => {
				toast.success("Writer deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGhostwriters.queryKey(),
				});
				navigate({ to: "/app/creation/writers" });
			},
			onError: () => {
				toast.error("Failed to delete writer");
			},
		}),
	);

	const updateWriterMutation = useMutation(
		trpc.contentRouter.updateGhostwriter.mutationOptions({
			onSuccess: () => {
				toast.success("Writer updated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGhostwriter.queryKey({ id }),
				});
			},
			onError: () => {
				toast.error("Failed to update writer");
			},
		}),
	);

	const addOriginalContentMutation = useMutation(
		trpc.contentRouter.addOriginalContents.mutationOptions({
			onSuccess: () => {
				toast.success("Original content added successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGhostwriter.queryKey({ id }),
				});
				setAddContentDialogOpen(false);
				setNewContent("");
			},
			onError: () => {
				toast.error("Failed to add original content");
			},
		}),
	);

	const deleteOriginalContentMutation = useMutation(
		trpc.contentRouter.deleteOriginalContent.mutationOptions({
			onSuccess: () => {
				toast.success("Original content deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGhostwriter.queryKey({ id }),
				});
				setDeleteContentDialogOpen(false);
				setContentToDelete(null);
			},
			onError: () => {
				toast.error("Failed to delete original content");
			},
		}),
	);

	const regenerateProfilesMutation = useMutation(
		trpc.contentRouter.regenerateProfiles.mutationOptions({
			onSuccess: () => {
				toast.success("Profiles regenerated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGhostwriter.queryKey({ id }),
				});
				setRegenerateDialogOpen(false);
				setPsyProfileName("");
				setWritingProfileName("");
			},
			onError: (error) => {
				if (
					error.message ===
					"API key not configured. Please add your Gemini API key in settings."
				) {
					toast.error("API key required. Please configure it in settings.");
				} else {
					toast.error("Failed to regenerate profiles");
				}
			},
		}),
	);

	const updateGeneratedContentMutation = useMutation(
		trpc.contentRouter.updateGeneratedContent.mutationOptions({
			onSuccess: () => {
				toast.success("Training data updated");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGhostwriter.queryKey({ id }),
				});
			},
			onError: () => {
				toast.error("Failed to update training data");
			},
		}),
	);

	const extractPersonaMutation = useMutation(
		trpc.contentRouter.extractPersonaFromContent.mutationOptions({
			onSuccess: () => {
				toast.success("Persona extracted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGhostwriter.queryKey({ id }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPersonas.queryKey(),
				});
				setExtractPersonaDialogOpen(false);
				setExtractPersonaName("");
				setSetAsBasePersona(true);
			},
			onError: (error) => {
				if (
					error.message ===
					"API key not configured. Please add your Gemini API key in settings."
				) {
					toast.error("API key required. Please configure it in settings.");
				} else {
					toast.error("Failed to extract persona");
				}
			},
		}),
	);

	const updateWriterPersonaMutation = useMutation(
		trpc.contentRouter.updateGhostwriter.mutationOptions({
			onSuccess: () => {
				toast.success("Base persona updated");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getGhostwriter.queryKey({ id }),
				});
				setPersonaSelectionDialogOpen(false);
			},
			onError: () => {
				toast.error("Failed to update base persona");
			},
		}),
	);

	// Handlers
	const handleBack = () => {
		navigate({ to: "/app/creation/writers" });
	};

	const handleGenerate = () => {
		navigate({ to: "/app/creation/create", search: { gwId: id.toString() } });
	};

	const handleDeleteWriter = () => {
		deleteWriterMutation.mutate({ id });
	};

	const handleAddContent = () => {
		if (!newContent.trim()) {
			toast.error("Please provide content");
			return;
		}
		addOriginalContentMutation.mutate({ content: newContent, gwId: id });
	};

	const handleDeleteContent = () => {
		if (contentToDelete) {
			deleteOriginalContentMutation.mutate({ id: contentToDelete });
		}
	};

	const handleRegenerateProfiles = () => {
		if (!psyProfileName.trim() || !writingProfileName.trim()) {
			toast.error("Please provide names for both profiles");
			return;
		}
		regenerateProfilesMutation.mutate({
			ghostwriterId: id,
			psyProfileName: psyProfileName.trim(),
			writingProfileName: writingProfileName.trim(),
		});
	};

	const handleToggleTrainingData = (
		contentId: number,
		currentStatus: boolean,
	) => {
		updateGeneratedContentMutation.mutate({
			id: contentId,
			isTrainingData: !currentStatus,
		});
	};

	const handleCopyContent = async (content: string) => {
		try {
			await navigator.clipboard.writeText(content);
			toast.success("Content copied to clipboard");
		} catch (error) {
			console.error("Copy failed:", error);
			toast.error("Failed to copy content");
		}
	};

	const handleDownloadContent = (content: string, prompt: string) => {
		const sanitizedPrompt = prompt
			.slice(0, 50)
			.replace(/[^a-z0-9]/gi, "-")
			.toLowerCase();
		const filename = `generated-${sanitizedPrompt || "content"}-${Date.now()}.md`;

		const blob = new Blob([content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success("Content downloaded");
	};

	const viewProfile = (
		type: "psy" | "writing",
		name: string,
		content: string,
	) => {
		setProfileToView({ type, name, content });
		setProfileDialogOpen(true);
	};

	const handleExtractPersona = () => {
		if (!extractPersonaName.trim()) {
			toast.error("Please provide a name for the persona");
			return;
		}
		extractPersonaMutation.mutate({
			ghostwriterId: id,
			personaName: extractPersonaName.trim(),
			setAsBasePersona,
		});
	};

	const handleChangeBasePersona = (personaId: number | null) => {
		updateWriterPersonaMutation.mutate({
			id,
			basePersonaId: personaId,
		});
	};

	const handleRemoveBasePersona = () => {
		updateWriterPersonaMutation.mutate({
			id,
			basePersonaId: null,
		});
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="container mx-auto p-2 lg:p-4 max-w-6xl">
				<Skeleton className="h-10 w-32 mb-6" />
				<Skeleton className="h-8 w-48 mb-2" />
				<Skeleton className="h-4 w-64 mb-6" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
					<Skeleton className="h-32" />
					<Skeleton className="h-32" />
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	// Error state
	if (error || !writer) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						{error ? "Failed to load writer." : "Writer not found."}
					</p>
					<Button onClick={handleBack}>Back to Writers</Button>
				</div>
			</div>
		);
	}

	const isComplete = writer.currentPsyProfile && writer.currentWritingProfile;
	const trainingData = writer.generatedContents.filter((c) => c.isTrainingData);
	const nonTrainingData = writer.generatedContents.filter(
		(c) => !c.isTrainingData,
	);

	return (
		<div className="container mx-auto p-2 lg:p-4 max-w-6xl">
			{/* Header */}
			<div className="mb-6">
				<Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
					<IconArrowLeft className="h-4 w-4 mr-2" />
					Back to Writers
				</Button>
				<div className="flex justify-between items-start">
					<div>
						<h1 className="text-3xl font-bold">{writer.name}</h1>
						{writer.description && (
							<p className="text-muted-foreground mt-1">{writer.description}</p>
						)}
						<div className="flex items-center gap-2 mt-2">
							{isComplete ? (
								<span className="text-sm text-green-600 dark:text-green-400">
									✓ Complete
								</span>
							) : (
								<span className="text-sm text-yellow-600 dark:text-yellow-400">
									⚠ Incomplete - Missing profiles
								</span>
							)}
						</div>
					</div>
					<div className="flex gap-2">
						{isComplete && (
							<Button onClick={handleGenerate}>
								<IconBrain className="h-4 w-4 mr-2" />
								Generate
							</Button>
						)}
						<Button
							variant="destructive"
							onClick={() => setDeleteDialogOpen(true)}
						>
							<IconTrash className="h-4 w-4 mr-2" />
							Delete
						</Button>
					</div>
				</div>
			</div>

			{/* Profile Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				{/* Psychology Profile Card */}
				<div className="rounded-lg border bg-background p-4">
					<h3 className="font-semibold mb-2">Psychology Profile</h3>
					{writer.currentPsyProfile ? (
						<>
							<p className="text-sm font-medium mb-2">
								{writer.currentPsyProfile.name}
							</p>
							<p className="text-sm text-muted-foreground line-clamp-3 mb-3">
								{writer.currentPsyProfile.content}
							</p>
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									viewProfile(
										"psy",
										writer.currentPsyProfile!.name,
										writer.currentPsyProfile!.content,
									)
								}
							>
								<IconEye className="h-4 w-4 mr-1.5" />
								View Full
							</Button>
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							No psychology profile set
						</p>
					)}
				</div>

				{/* Writing Profile Card */}
				<div className="rounded-lg border bg-background p-4">
					<h3 className="font-semibold mb-2">Writing Profile</h3>
					{writer.currentWritingProfile ? (
						<>
							<p className="text-sm font-medium mb-2">
								{writer.currentWritingProfile.name}
							</p>
							<p className="text-sm text-muted-foreground line-clamp-3 mb-3">
								{writer.currentWritingProfile.content}
							</p>
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									viewProfile(
										"writing",
										writer.currentWritingProfile!.name,
										writer.currentWritingProfile!.content,
									)
								}
							>
								<IconEye className="h-4 w-4 mr-1.5" />
								View Full
							</Button>
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							No writing profile set
						</p>
					)}
				</div>

				{/* Base Persona Card */}
				<div className="rounded-lg border bg-background p-4 md:col-span-2">
					<div className="flex justify-between items-start mb-2">
						<h3 className="font-semibold">Base Persona</h3>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setPersonaSelectionDialogOpen(true)}
							>
								{writer.basePersona ? "Change" : "Set Persona"}
							</Button>
							{writer.basePersona && (
								<Button
									size="sm"
									variant="outline"
									onClick={handleRemoveBasePersona}
									disabled={updateWriterPersonaMutation.isPending}
								>
									Remove
								</Button>
							)}
						</div>
					</div>
					{writer.basePersona ? (
						<>
							<p className="text-sm font-medium mb-2">
								{writer.basePersona.name}
							</p>
							{writer.basePersona.description && (
								<p className="text-sm text-muted-foreground">
									{writer.basePersona.description}
								</p>
							)}
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							No base persona set. Extract one from content or select an
							existing persona.
						</p>
					)}
				</div>
			</div>

			{/* Stats Section */}
			<div className="grid grid-cols-3 gap-4 mb-8">
				<div className="rounded-lg border bg-background p-4 text-center">
					<p className="text-2xl font-bold">
						{writer.stats.originalContentCount}
					</p>
					<p className="text-sm text-muted-foreground">Original Samples</p>
				</div>
				<div className="rounded-lg border bg-background p-4 text-center">
					<p className="text-2xl font-bold">{writer.stats.trainingDataCount}</p>
					<p className="text-sm text-muted-foreground">Training Data</p>
				</div>
				<div className="rounded-lg border bg-background p-4 text-center">
					<p className="text-2xl font-bold">
						{writer.stats.totalGeneratedCount}
					</p>
					<p className="text-sm text-muted-foreground">Total Generated</p>
				</div>
			</div>

			{/* Tabbed Content */}
			<Tabs defaultValue="original" className="space-y-4">
				<TabsList>
					<TabsTrigger value="original">
						Original Content ({writer.stats.originalContentCount})
					</TabsTrigger>
					<TabsTrigger value="training">
						Training Data ({writer.stats.trainingDataCount})
					</TabsTrigger>
					<TabsTrigger value="generated">
						All Generated ({writer.stats.totalGeneratedCount})
					</TabsTrigger>
				</TabsList>

				{/* Original Content Tab */}
				<TabsContent value="original" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Original Writing Samples</h3>
						<div className="flex gap-2">
							{writer.originalContents.length > 0 && (
								<>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setExtractPersonaDialogOpen(true)}
									>
										Extract Persona
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setRegenerateDialogOpen(true)}
									>
										Regenerate Profiles
									</Button>
								</>
							)}
							<Button size="sm" onClick={() => setAddContentDialogOpen(true)}>
								<IconPlus className="h-4 w-4 mr-1.5" />
								Add Content
							</Button>
						</div>
					</div>

					{writer.originalContents.length === 0 ? (
						<div className="rounded-lg border bg-background p-8 text-center">
							<p className="text-muted-foreground mb-4">
								No original content samples yet
							</p>
							<Button onClick={() => setAddContentDialogOpen(true)}>
								<IconPlus className="h-4 w-4 mr-2" />
								Add Original Content
							</Button>
						</div>
					) : (
						<div className="divide-y divide-border rounded-lg border bg-background">
							{writer.originalContents.map((content) => (
								<div
									key={content.id}
									className="flex items-start justify-between p-4 hover:bg-muted/50 transition-colors"
								>
									<div className="flex-1 min-w-0 mr-4">
										<p className="text-sm line-clamp-3">{content.content}</p>
										<p className="text-xs text-muted-foreground mt-2">
											Added {new Date(content.createdAt).toLocaleDateString()}
										</p>
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setContentToDelete(content.id);
											setDeleteContentDialogOpen(true);
										}}
									>
										<IconTrash className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</TabsContent>

				{/* Training Data Tab */}
				<TabsContent value="training" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Training Data</h3>
					</div>

					{trainingData.length === 0 ? (
						<div className="rounded-lg border bg-background p-8 text-center">
							<p className="text-muted-foreground">
								No training data yet. Generate content and mark it as training
								data to improve the writer.
							</p>
						</div>
					) : (
						<div className="divide-y divide-border rounded-lg border bg-background">
							{trainingData.map((content) => (
								<div key={content.id} className="p-4 space-y-3">
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0 mr-4">
											<p className="text-sm font-medium mb-1">Prompt:</p>
											<p className="text-sm text-muted-foreground line-clamp-2">
												{content.prompt}
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												handleToggleTrainingData(
													content.id,
													content.isTrainingData,
												)
											}
										>
											Remove from Training
										</Button>
									</div>
									<div>
										<p className="text-sm font-medium mb-1">
											Generated Content:
										</p>
										<p className="text-sm line-clamp-3">{content.content}</p>
									</div>
									{content.userFeedBack && (
										<div>
											<p className="text-sm font-medium mb-1">Feedback:</p>
											<p className="text-sm text-muted-foreground">
												{content.userFeedBack}
											</p>
										</div>
									)}
									{content.persona && (
										<p className="text-xs text-muted-foreground">
											Persona: {content.persona.name}
										</p>
									)}
									<p className="text-xs text-muted-foreground">
										Generated {new Date(content.createdAt).toLocaleDateString()}
									</p>
								</div>
							))}
						</div>
					)}
				</TabsContent>

				{/* All Generated Content Tab */}
				<TabsContent value="generated" className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">All Generated Content</h3>
					</div>

					{writer.generatedContents.length === 0 ? (
						<div className="rounded-lg border bg-background p-8 text-center">
							<p className="text-muted-foreground mb-4">
								No content generated yet
							</p>
							{isComplete && (
								<Button onClick={handleGenerate}>
									<IconBrain className="h-4 w-4 mr-2" />
									Generate Content
								</Button>
							)}
						</div>
					) : (
						<div className="divide-y divide-border rounded-lg border bg-background">
							{writer.generatedContents.map((content) => (
								<div key={content.id} className="p-4 space-y-3">
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0 mr-4">
											<p className="text-sm font-medium mb-1">Prompt:</p>
											<p className="text-sm text-muted-foreground line-clamp-2">
												{content.prompt}
											</p>
										</div>
										<div className="flex items-center gap-2">
											{!content.isTrainingData && (
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														handleToggleTrainingData(
															content.id,
															content.isTrainingData,
														)
													}
												>
													Add to Training
												</Button>
											)}
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleCopyContent(content.content)}
											>
												<IconCopy className="h-4 w-4" />
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													handleDownloadContent(content.content, content.prompt)
												}
											>
												<IconDownload className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div>
										<p className="text-sm font-medium mb-1">
											Generated Content:
										</p>
										<p className="text-sm line-clamp-4">{content.content}</p>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4 text-xs text-muted-foreground">
											{content.isTrainingData && (
												<span className="text-green-600 dark:text-green-400">
													✓ Training Data
												</span>
											)}
											{content.persona && (
												<span>Persona: {content.persona.name}</span>
											)}
											<span>
												Generated{" "}
												{new Date(content.createdAt).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Delete Writer Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Writer</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{writer.name}"? This action
							cannot be undone. The writer will be soft-deleted and can be
							recovered if needed.
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
							onClick={handleDeleteWriter}
							disabled={deleteWriterMutation.isPending}
						>
							{deleteWriterMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Content Dialog */}
			<Dialog
				open={deleteContentDialogOpen}
				onOpenChange={setDeleteContentDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Original Content</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this original content? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDeleteContentDialogOpen(false);
								setContentToDelete(null);
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteContent}
							disabled={deleteOriginalContentMutation.isPending}
						>
							{deleteOriginalContentMutation.isPending
								? "Deleting..."
								: "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Content Dialog */}
			<Dialog
				open={addContentDialogOpen}
				onOpenChange={setAddContentDialogOpen}
			>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Add Original Content</DialogTitle>
						<DialogDescription>
							Add original writing samples from the author you want to emulate.
							Separate multiple samples with "===".
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={newContentId}>Content</Label>
							<Textarea
								id={newContentId}
								value={newContent}
								onChange={(e) => setNewContent(e.target.value)}
								placeholder="Paste original content here..."
								className="min-h-[120px] max-h-[350px] overflow-y-auto"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddContentDialogOpen(false);
								setNewContent("");
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleAddContent}
							disabled={addOriginalContentMutation.isPending}
						>
							{addOriginalContentMutation.isPending
								? "Adding..."
								: "Add Content"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Regenerate Profiles Dialog */}
			<Dialog
				open={regenerateDialogOpen}
				onOpenChange={setRegenerateDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Regenerate Profiles</DialogTitle>
						<DialogDescription>
							This will create new psychology and writing profiles based on all
							current original content. The old profiles will be replaced.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={psyProfileNameId}>
								Psychology Profile Name *
							</Label>
							<Input
								id={psyProfileNameId}
								value={psyProfileName}
								onChange={(e) => setPsyProfileName(e.target.value)}
								placeholder="e.g. Updated Psychology Profile"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={writingProfileNameId}>
								Writing Profile Name *
							</Label>
							<Input
								id={writingProfileNameId}
								value={writingProfileName}
								onChange={(e) => setWritingProfileName(e.target.value)}
								placeholder="e.g. Updated Writing Style"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setRegenerateDialogOpen(false);
								setPsyProfileName("");
								setWritingProfileName("");
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleRegenerateProfiles}
							disabled={regenerateProfilesMutation.isPending}
						>
							{regenerateProfilesMutation.isPending ? (
								<>
									<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
									Regenerating...
								</>
							) : (
								"Regenerate"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Profile View Dialog */}
			<Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
				<DialogContent className="sm:max-w-2xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle>
							{profileToView?.type === "psy" ? "Psychology" : "Writing"}{" "}
							Profile: {profileToView?.name}
						</DialogTitle>
					</DialogHeader>
					<div className="overflow-y-auto max-h-[60vh] prose prose-sm dark:prose-invert">
						<ReactMarkdown>{profileToView?.content || ""}</ReactMarkdown>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								if (profileToView) {
									handleCopyContent(profileToView.content);
								}
							}}
						>
							<IconCopy className="h-4 w-4 mr-2" />
							Copy
						</Button>
						<Button onClick={() => setProfileDialogOpen(false)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Extract Persona Dialog */}
			<Dialog
				open={extractPersonaDialogOpen}
				onOpenChange={setExtractPersonaDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Extract Persona from Content</DialogTitle>
						<DialogDescription>
							Analyze the original content to extract a persona profile
							representing the target audience. This will create a new persona
							based on who the content appears to be written for.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={extractPersonaNameId}>Persona Name *</Label>
							<Input
								id={extractPersonaNameId}
								value={extractPersonaName}
								onChange={(e) => setExtractPersonaName(e.target.value)}
								placeholder="e.g. Target Reader Profile"
							/>
						</div>
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id={basePersonaId}
								checked={setAsBasePersona}
								onChange={(e) => setSetAsBasePersona(e.target.checked)}
								className="rounded border border-input"
							/>
							<Label htmlFor={basePersonaId} className="text-sm">
								Set as base persona for this writer
							</Label>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setExtractPersonaDialogOpen(false);
								setExtractPersonaName("");
								setSetAsBasePersona(true);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleExtractPersona}
							disabled={extractPersonaMutation.isPending}
						>
							{extractPersonaMutation.isPending ? (
								<>
									<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
									Extracting...
								</>
							) : (
								"Extract Persona"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Persona Selection Dialog */}
			<Dialog
				open={personaSelectionDialogOpen}
				onOpenChange={setPersonaSelectionDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Select Base Persona</DialogTitle>
						<DialogDescription>
							Choose a persona to set as the default for this writer, or remove
							the current base persona.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{userPersonas && userPersonas.length > 0 ? (
							<div className="divide-y divide-border rounded-lg border bg-background">
								{userPersonas.map((persona) => (
									<div
										key={persona.id}
										className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
									>
										<div className="flex-1 min-w-0 mr-4">
											<p className="text-sm font-medium">{persona.name}</p>
											{persona.description && (
												<p className="text-xs text-muted-foreground line-clamp-1">
													{persona.description}
												</p>
											)}
										</div>
										<Button
											size="sm"
											variant={
												writer.basePersonaId === persona.id
													? "default"
													: "outline"
											}
											onClick={() => handleChangeBasePersona(persona.id)}
											disabled={updateWriterPersonaMutation.isPending}
										>
											{writer.basePersonaId === persona.id
												? "Current"
												: "Select"}
										</Button>
									</div>
								))}
							</div>
						) : (
							<div className="rounded-lg border bg-background p-8 text-center">
								<p className="text-muted-foreground">
									No personas available. Extract one from content first.
								</p>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setPersonaSelectionDialogOpen(false)}
						>
							Cancel
						</Button>
						{writer.basePersona && (
							<Button
								variant="destructive"
								onClick={handleRemoveBasePersona}
								disabled={updateWriterPersonaMutation.isPending}
							>
								Remove Current
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
