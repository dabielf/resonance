import {
	IconArrowBackUp,
	IconBookmark,
	IconBrain,
	IconCheck,
	IconCopy,
	IconDownload,
	IconEdit,
	IconEye,
	IconLoader2,
	IconPlus,
	IconSettings,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { ContentHistory } from "@/../../worker/types/gw";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/create")({
	component: ContentGenerator,
});

type GenerationMode = "writer" | "custom";
type ContentMode = "display" | "edit";

export default function ContentGenerator() {
	// Generate unique IDs for accessibility
	const generationModeId = useId();
	const topicInputId = useId();
	const feedbackId = useId();
	const revisionRequestId = useId();
	const saveTitleId = useId();
	const queryClient = useQueryClient();

	// State management
	const [mode, setMode] = useState<GenerationMode>("writer");
	const [selectedWriterId, setSelectedWriterId] = useState<string>("");
	const [selectedPsyProfileId, setSelectedPsyProfileId] = useState<string>("");
	const [selectedWritingProfileId, setSelectedWritingProfileId] =
		useState<string>("");
	const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
	const [selectedInsightId, setSelectedInsightId] = useState<string>("");
	const [topic, setTopic] = useState("");
	const [generatedContent, setGeneratedContent] = useState<string | null>(null);
	const [contentMode, setContentMode] = useState<ContentMode>("display");
	const [editedContent, setEditedContent] = useState<string>("");

	// Content history state
	const [contentHistory, setContentHistory] = useState<ContentHistory[]>([]);
	const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);

	// Training dialog state
	const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
	const [userFeedback, setUserFeedback] = useState("");

	// Save dialog state
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [saveTitle, setSaveTitle] = useState("");

	// Revision dialog state
	const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
	const [revisionRequest, setRevisionRequest] = useState("");
	const [isRevising, setIsRevising] = useState(false);

	// Insight dialog state
	const [insightDialogOpen, setInsightDialogOpen] = useState(false);

	// Auto-selection flag
	const [hasAutoSelected, setHasAutoSelected] = useState(false);

	// Track previous writer to only auto-populate persona on writer change
	const [previousWriterId, setPreviousWriterId] = useState<string>("");

	// Track if content has been saved
	const [isContentSaved, setIsContentSaved] = useState(false);

	// Fetch user data
	const {
		data,
		isLoading: isLoadingData,
		error: dataError,
	} = useQuery(trpc.contentRouter.getUserData.queryOptions());

	// Fetch insights for selected persona
	const { data: personaInsights, isLoading: isLoadingInsights } = useQuery(
		trpc.resourceRouter.listInsightsForPersona.queryOptions(
			{ 
				personaId: parseInt(selectedPersonaId),
				filterGenerated: true 
			},
			{ enabled: !!selectedPersonaId },
		),
	);

	const user = data;
	const search = useSearch({ from: "/app/creation/create" }) as {
		gwId?: string;
	};

	// Filter complete writers (those with both profiles)
	const completeWriters =
		user?.ghostwriters?.filter(
			(writer) => writer.psyProfileId && writer.writingProfileId,
		) || [];

	// Auto-populate persona only when writer changes (not on every render)
	useEffect(() => {
		if (
			mode === "writer" &&
			selectedWriterId &&
			selectedWriterId !== previousWriterId
		) {
			const writer = completeWriters.find(
				(w) => w.id.toString() === selectedWriterId,
			);
			if (writer?.basePersonaId) {
				setSelectedPersonaId(writer.basePersonaId.toString());
			} else {
				// Clear persona if writer has no base persona
				setSelectedPersonaId("");
			}
			setPreviousWriterId(selectedWriterId);
		} else if (mode === "custom" && previousWriterId) {
			// Clear tracking when switching to custom mode
			setPreviousWriterId("");
		}
	}, [selectedWriterId, mode, completeWriters, previousWriterId]);

	// Auto-select writer from URL query parameter (one-time only)
	useEffect(() => {
		const gwId = search.gwId;
		if (gwId && completeWriters.length > 0 && !hasAutoSelected) {
			const writerId = parseInt(gwId as string);
			const writer = completeWriters.find((w) => w.id === writerId);
			if (writer) {
				setMode("writer");
				setSelectedWriterId(writer.id.toString());
				setHasAutoSelected(true);
			}
		}
	}, [search.gwId, completeWriters, hasAutoSelected]);

	// Generate content mutation
	const generateContentMutation = useMutation(
		trpc.contentRouter.generateContent.mutationOptions({
			onSuccess: (data) => {
				setGeneratedContent(data);
				setEditedContent(data);
				setContentMode("display");
				setIsContentSaved(false); // Reset saved state for new content
				// Initialize content history with first generation
				setContentHistory([{ contentGenerated: data }]);
				setCurrentVersionIndex(0);
			},
			onError: (error) => {
				console.error("Generation failed:", error);
			},
		}),
	);

	// Save content mutation
	const saveContentMutation = useMutation(
		trpc.contentRouter.saveGeneratedContent.mutationOptions({
			onSuccess: () => {
				toast.success("Content saved successfully");
				setIsContentSaved(true);
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGeneratedContents.queryKey(),
				});
			},
			onError: (error) => {
				toast.error("Failed to save content");
				console.error("Save failed:", error);
			},
		}),
	);

	// Revise content mutation
	const reviseContentMutation = useMutation(
		trpc.contentRouter.reviseContent.mutationOptions({
			onSuccess: (data) => {
				// Append revised content to history with the revision request
				setContentHistory((prev) => [
					...prev,
					{
						contentGenerated: data,
						revisionAsked: revisionRequest,
					},
				]);
				setCurrentVersionIndex((prev) => prev + 1);
				setGeneratedContent(data);
				setEditedContent(data);
				setContentMode("display");
				setIsContentSaved(false); // Reset saved state for revised content
				setRevisionDialogOpen(false);
				setRevisionRequest("");
				setIsRevising(false);
				toast.success("Content revised successfully");
			},
			onError: (error) => {
				setIsRevising(false);
				if (error.message === "MISSING_API_KEY") {
					toast.error("API key required. Please check your settings.");
				} else {
					toast.error("Failed to revise content");
				}
				console.error("Revision failed:", error);
			},
		}),
	);

	// Handle form submission
	const handleGenerate = () => {
		if (!isFormValid()) return;

		let psychologyProfileId: number;
		let writingProfileId: number;
		let gwId: number | undefined;

		if (mode === "writer") {
			if (!selectedWriterId) return;

			const writer = completeWriters.find(
				(w) => w.id.toString() === selectedWriterId,
			);
			if (!writer || !writer.psyProfileId || !writer.writingProfileId) return;

			psychologyProfileId = writer.psyProfileId;
			writingProfileId = writer.writingProfileId;
			gwId = writer.id;
		} else {
			if (!selectedPsyProfileId || !selectedWritingProfileId) return;

			psychologyProfileId = parseInt(selectedPsyProfileId);
			writingProfileId = parseInt(selectedWritingProfileId);
		}

		generateContentMutation.mutate({
			psychologyProfileId,
			writingProfileId,
			personaProfileId: selectedPersonaId
				? parseInt(selectedPersonaId)
				: undefined,
			gwId,
			topic: topic.trim(),
			insightId: selectedInsightId ? parseInt(selectedInsightId) : undefined,
		});
	};

	// Handle content mode change
	const handleContentModeChange = (newMode: ContentMode) => {
		if (newMode === "edit" && generatedContent) {
			setEditedContent(generatedContent);
		}
		setContentMode(newMode);
	};

	// Handle edited content save
	const handleSaveEdit = () => {
		setGeneratedContent(editedContent);
		setContentMode("display");
	};

	// Check if form is valid
	const isFormValid = () => {
		// Content validation: require either topic or insight
		const hasContent = topic.trim() || selectedInsightId;
		if (!hasContent) return false;

		// Profile validation
		if (mode === "writer") {
			return !!selectedWriterId;
		} else {
			return !!selectedPsyProfileId && !!selectedWritingProfileId;
		}
	};

	// Helper function to collect generation parameters
	const getGenerationParams = () => {
		let psychologyProfileId: number;
		let writingProfileId: number;
		let gwId: number | undefined;

		if (mode === "writer") {
			const writer = completeWriters.find(
				(w) => w.id.toString() === selectedWriterId,
			);
			if (!writer || !writer.psyProfileId || !writer.writingProfileId)
				return null;

			psychologyProfileId = writer.psyProfileId;
			writingProfileId = writer.writingProfileId;
			gwId = writer.id;
		} else {
			if (!selectedPsyProfileId || !selectedWritingProfileId) return null;

			psychologyProfileId = parseInt(selectedPsyProfileId);
			writingProfileId = parseInt(selectedWritingProfileId);
		}

		return {
			psychologyProfileId,
			writingProfileId,
			gwId,
			personaProfileId: selectedPersonaId
				? parseInt(selectedPersonaId)
				: undefined,
		};
	};

	// Save content handler
	const handleSaveContent = (isTrainingData: boolean, feedback?: string, customTitle?: string) => {
		if (!generatedContent || !topic.trim()) return;

		const params = getGenerationParams();
		if (!params) return;

		const contentToSave =
			contentMode === "edit" ? editedContent : generatedContent;

		saveContentMutation.mutate({
			content: contentToSave,
			gwId: params.gwId,
			psyProfileId: params.psychologyProfileId,
			writingProfileId: params.writingProfileId,
			personaProfileId: params.personaProfileId,
			prompt: customTitle || topic.trim(),
			userFeedback: feedback,
			isTrainingData,
			insightId: selectedInsightId ? parseInt(selectedInsightId) : undefined,
		});
	};

	// Copy to clipboard handler
	const handleCopyToClipboard = async () => {
		if (!generatedContent) return;

		const contentToCopy =
			contentMode === "edit" ? editedContent : generatedContent;

		try {
			await navigator.clipboard.writeText(contentToCopy);
			toast.success("Content copied to clipboard");
		} catch (error) {
			console.error("Copy failed:", error);
			toast.error("Failed to copy content");
		}
	};

	// Download as markdown handler
	const handleDownloadMarkdown = () => {
		if (!generatedContent) return;

		const contentToDownload =
			contentMode === "edit" ? editedContent : generatedContent;

		// Create filename from topic (sanitized)
		const sanitizedTopic = topic
			.trim()
			.slice(0, 50)
			.replace(/[^a-z0-9]/gi, "-")
			.toLowerCase();
		const filename = `content-${sanitizedTopic || "generated"}-${Date.now()}.md`;

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

	// Save dialog handler
	const handleOpenSaveDialog = () => {
		setSaveTitle(selectedInsight ? selectedInsight.title : "");
		setSaveDialogOpen(true);
	};

	// Confirm save content
	const confirmSaveContent = () => {
		handleSaveContent(false, undefined, saveTitle.trim() || undefined);
		setSaveDialogOpen(false);
		setSaveTitle("");
	};

	// Training data save handler
	const handleSaveAsTrainingData = () => {
		setUserFeedback("");
		setTrainingDialogOpen(true);
	};

	// Confirm training data save
	const confirmTrainingDataSave = () => {
		handleSaveContent(true, userFeedback.trim() || undefined);
		setTrainingDialogOpen(false);
		setUserFeedback("");
	};

	// Insight handlers
	const handleSelectInsight = (insightId: string) => {
		setSelectedInsightId(insightId);
		setInsightDialogOpen(false);
	};

	const handleResetInsight = () => {
		setSelectedInsightId("");
	};

	// Revision handlers
	const handleRequestRevision = () => {
		setRevisionRequest("");
		setRevisionDialogOpen(true);
	};

	const handleSubmitRevision = () => {
		if (!revisionRequest.trim() || !generatedContent) return;

		const params = getGenerationParams();
		if (!params) return;

		const contentToRevise =
			contentMode === "edit" ? editedContent : generatedContent;

		setIsRevising(true);
		reviseContentMutation.mutate({
			contentToRevise,
			revisionRequest: revisionRequest.trim(),
			psychologyProfileId: params.psychologyProfileId,
			writingProfileId: params.writingProfileId,
			personaProfileId: params.personaProfileId,
			contentHistory: contentHistory.length > 0 ? contentHistory : undefined,
		});
	};

	const handleBackToPreviousVersion = () => {
		if (currentVersionIndex > 0) {
			const newIndex = currentVersionIndex - 1;
			setCurrentVersionIndex(newIndex);
			const previousContent = contentHistory[newIndex].contentGenerated;
			setGeneratedContent(previousContent);
			setEditedContent(previousContent);
			setIsContentSaved(false); // Reset saved state when reverting to previous version
			toast.success(
				`Reverted to version ${newIndex + 1} of ${contentHistory.length}`,
			);
		}
	};

	// Get selected insight details
	const selectedInsight = personaInsights?.find(
		(insight) => insight.id.toString() === selectedInsightId,
	);

	// Group insights by resource
	const groupInsightsByResource = (insights: typeof personaInsights) => {
		if (!insights) return {};
		
		const grouped = insights.reduce((acc, insight) => {
			const resourceTitle = insight.resourceContent?.title || "Uncategorized";
			if (!acc[resourceTitle]) {
				acc[resourceTitle] = [];
			}
			acc[resourceTitle].push(insight);
			return acc;
		}, {} as Record<string, typeof insights>);
		
		// Sort resource names alphabetically
		return Object.keys(grouped).sort().reduce((acc, key) => {
			acc[key] = grouped[key];
			return acc;
		}, {} as Record<string, typeof insights>);
	};

	const groupedInsights = groupInsightsByResource(personaInsights);

	// Loading state
	if (isLoadingData) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="flex items-center gap-3">
						<IconLoader2 className="h-6 w-6 animate-spin text-primary" />
						<span className="text-lg">Loading your data...</span>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (dataError) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						Failed to load your data. Please try again.
					</p>
					<Button onClick={() => window.location.reload()}>Retry</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-2 lg:p-4">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Content Generator</h1>
				<p className="text-muted-foreground mt-1">
					Generate content using your AI writers and profiles
				</p>
			</div>

			{/* Main Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-[600px]">
				{/* Control Panel */}
				<div className="lg:col-span-2">
					<div className="space-y-6">
						{/* Mode Selection */}
						<div>
							<label
								htmlFor={generationModeId}
								className="text-sm font-medium mb-3 block"
							>
								Generation Mode
							</label>
							<Tabs
								id={generationModeId}
								value={mode}
								onValueChange={(value) => setMode(value as GenerationMode)}
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="writer">Writer</TabsTrigger>
									<TabsTrigger value="custom">Custom</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						{/* Mode-specific Controls */}
						{mode === "writer" ? (
							<div>
								<label
									htmlFor="writer-select"
									className="text-sm font-medium mb-3 block"
								>
									Select Writer
								</label>
								<Select
									value={selectedWriterId}
									onValueChange={setSelectedWriterId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Choose a writer" />
									</SelectTrigger>
									<SelectContent>
										{completeWriters.length === 0 ? (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												No complete writers available
											</div>
										) : (
											completeWriters.map((writer) => (
												<SelectItem
													key={writer.id}
													value={writer.id.toString()}
												>
													{writer.name}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
								{completeWriters.length === 0 && (
									<p className="text-xs text-muted-foreground mt-2">
										Create writers with both psychology and writing profiles in
										the{" "}
										<Link
											to="/app/creation/writers"
											className="text-primary hover:underline"
										>
											Writers section
										</Link>
									</p>
								)}
							</div>
						) : (
							<div className="space-y-4">
								<div>
									<label
										htmlFor="psychology-profile"
										className="text-sm font-medium mb-3 block"
									>
										Psychology Profile
									</label>
									<Select
										value={selectedPsyProfileId}
										onValueChange={setSelectedPsyProfileId}
									>
										<SelectTrigger>
											<SelectValue placeholder="Choose psychology profile" />
										</SelectTrigger>
										<SelectContent>
											{user?.psyProfiles?.map((profile) => (
												<SelectItem
													key={profile.id}
													value={profile.id.toString()}
												>
													{profile.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<label
										htmlFor="writing-profile"
										className="text-sm font-medium mb-3 block"
									>
										Writing Profile
									</label>
									<Select
										value={selectedWritingProfileId}
										onValueChange={setSelectedWritingProfileId}
									>
										<SelectTrigger>
											<SelectValue placeholder="Choose writing profile" />
										</SelectTrigger>
										<SelectContent>
											{user?.writingProfiles?.map((profile) => (
												<SelectItem
													key={profile.id}
													value={profile.id.toString()}
												>
													{profile.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{/* Persona Selector */}
						<div>
							<label
								htmlFor="persona-select"
								className="text-sm font-medium mb-3 block"
							>
								Persona{" "}
								<span className="text-xs text-muted-foreground">
									(Optional)
								</span>
							</label>
							<div className="flex items-center gap-2">
								<Select
									value={selectedPersonaId}
									onValueChange={setSelectedPersonaId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Choose persona" />
									</SelectTrigger>
									<SelectContent>
										{user?.personas?.map((persona) => (
											<SelectItem
												key={persona.id}
												value={persona.id.toString()}
											>
												{persona.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{selectedPersonaId && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setSelectedPersonaId("")}
									>
										Clear
									</Button>
								)}
							</div>
						</div>

						{/* Insights Selector */}
						<div>
							<label
								htmlFor="insights-select"
								className="text-sm font-medium mb-3 block"
							>
								Insights{" "}
								<span className="text-xs text-muted-foreground">
									(Optional)
								</span>
							</label>
							{selectedPersonaId &&
							personaInsights &&
							personaInsights.length > 0 ? (
								selectedInsightId ? (
									<div className="flex items-center gap-2">
										<div className="flex-1 px-3 py-2 border rounded-md bg-muted/50">
											<span className="text-sm font-medium">
												{selectedInsight?.title}
											</span>
											<div className="text-xs text-muted-foreground mt-1">
												From: {selectedInsight?.resourceContent?.title}
											</div>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleResetInsight}
										>
											Reset
										</Button>
									</div>
								) : (
									<Button
										type="button"
										variant="outline"
										onClick={() => setInsightDialogOpen(true)}
										className="w-full justify-start"
										disabled={isLoadingInsights}
									>
										<IconPlus className="h-4 w-4 mr-2" />
										{isLoadingInsights ? "Loading insights..." : "Add Insight"}
									</Button>
								)
							) : (
								<div className="px-3 py-2 border rounded-md bg-muted/20 text-sm text-muted-foreground">
									{!selectedPersonaId
										? "Select a persona to see available insights"
										: isLoadingInsights
											? "Loading insights..."
											: "No insights available for this persona"}
								</div>
							)}
						</div>

						{/* Topic Input / Additional Instructions */}
						<div>
							<label
								htmlFor={topicInputId}
								className="text-sm font-medium mb-3 block"
							>
								{selectedInsightId ? (
									"Additional Instructions"
								) : (
									<>
										Topic <span className="text-destructive">*</span>
									</>
								)}{" "}
								<span className="text-xs text-muted-foreground">
									{selectedInsightId ? "(Optional)" : ""}
								</span>
							</label>
							<Textarea
								id={topicInputId}
								value={topic}
								onChange={(e) => setTopic(e.target.value)}
								placeholder={
									selectedInsightId
										? "Any additional guidance or modifications to the insight?"
										: "What would you like to write about?"
								}
								className="min-h-[100px] resize-none"
							/>
						</div>

						{/* Generate Button */}
						<Button
							onClick={handleGenerate}
							disabled={!isFormValid() || generateContentMutation.isPending}
							className="w-full"
							size="lg"
						>
							{generateContentMutation.isPending ? (
								<>
									<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<IconBrain className="h-4 w-4 mr-2" />
									Generate Content
								</>
							)}
						</Button>
					</div>
				</div>

				{/* Content Area */}
				<div className="lg:col-span-3">
					<div className="h-full border rounded-lg bg-background">
						{generateContentMutation.error ? (
							<div className="p-8 text-center">
								<div className="text-destructive mb-4">
									{generateContentMutation.error.message ===
									"MISSING_API_KEY" ? (
										<>
											<h3 className="font-semibold mb-2">
												Gemini API Key Required
											</h3>
											<p className="text-sm text-muted-foreground mb-4">
												You need to configure your Gemini API key to generate
												content.
											</p>
											<Link to="/app/settings">
												<Button variant="outline" size="sm">
													<IconSettings className="h-4 w-4 mr-2" />
													Go to Settings
												</Button>
											</Link>
										</>
									) : (
										<>
											<h3 className="font-semibold mb-2">Generation Failed</h3>
											<p className="text-sm text-muted-foreground">
												{generateContentMutation.error.message}
											</p>
										</>
									)}
								</div>
							</div>
						) : generatedContent ? (
							<div className="h-full flex flex-col">
								{/* Content Header with Actions */}
								<div className="border-b px-4 py-3 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<h3 className="font-medium">Generated Content</h3>
										{isContentSaved && (
											<div className="flex items-center gap-1 text-green-600 text-sm">
												<IconCheck className="h-4 w-4" />
												<span>Saved</span>
											</div>
										)}
										{contentHistory.length > 1 && (
											<span className="text-sm text-muted-foreground">
												(Version {currentVersionIndex + 1} of{" "}
												{contentHistory.length})
											</span>
										)}
									</div>
									<div className="flex items-center gap-3">
										{/* Actions Menu */}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													disabled={saveContentMutation.isPending || isRevising}
												>
													Actions
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={handleOpenSaveDialog}
												>
													<IconBookmark className="h-4 w-4 mr-2" />
													Save Content
												</DropdownMenuItem>
												{mode === "writer" && getGenerationParams()?.gwId && (
													<DropdownMenuItem onClick={handleSaveAsTrainingData}>
														<IconBookmark className="h-4 w-4 mr-2" />
														Save as Training Data
													</DropdownMenuItem>
												)}
												<DropdownMenuItem onClick={handleRequestRevision}>
													<IconEdit className="h-4 w-4 mr-2" />
													Ask for Revision
												</DropdownMenuItem>
												{currentVersionIndex > 0 && (
													<DropdownMenuItem
														onClick={handleBackToPreviousVersion}
													>
														<IconArrowBackUp className="h-4 w-4 mr-2" />
														Back to Previous Version
													</DropdownMenuItem>
												)}
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

										{/* Mode Toggle */}
										<Tabs
											value={contentMode}
											onValueChange={(value) =>
												handleContentModeChange(value as ContentMode)
											}
										>
											<TabsList className="h-8">
												<TabsTrigger value="display" className="text-xs">
													<IconEye className="h-3 w-3 mr-1" />
													Display
												</TabsTrigger>
												<TabsTrigger value="edit" className="text-xs">
													<IconEdit className="h-3 w-3 mr-1" />
													Edit
												</TabsTrigger>
											</TabsList>
										</Tabs>
									</div>
								</div>

								{/* Content Display */}
								<div className="flex-1 overflow-hidden">
									{contentMode === "display" ? (
										<div className="h-full overflow-auto p-8 lg:p-12">
											<div className="prose prose-stone dark:prose-invert max-w-2xl mx-auto">
												<ReactMarkdown>{generatedContent}</ReactMarkdown>
											</div>
										</div>
									) : (
										<div className="h-full p-4 flex flex-col gap-3 max-w-2xl mx-auto">
											<Textarea
												value={editedContent}
												onChange={(e) => setEditedContent(e.target.value)}
												className="flex-1 resize-none text-sm font-mono"
												placeholder="Edit your content..."
											/>
											<div className="flex gap-2">
												<Button onClick={handleSaveEdit} size="sm">
													Save Changes
												</Button>
												<Button
													onClick={() => setContentMode("display")}
													variant="outline"
													size="sm"
												>
													Cancel
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
						) : generateContentMutation.isPending ? (
							<div className="h-full flex items-center justify-center p-8">
								<div className="text-center max-w-md">
									<IconLoader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
									<h3 className="text-lg font-semibold mb-2">
										Generating Content...
									</h3>
									<p className="text-muted-foreground text-sm">
										Your writer is crafting your content...
									</p>
								</div>
							</div>
						) : (
							<div className="h-full flex items-center justify-center p-8">
								<div className="text-center max-w-md">
									<IconBrain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-semibold mb-2">
										Ready to Generate
									</h3>
									<p className="text-muted-foreground text-sm">
										Select your generation mode, choose your profiles, enter a
										topic, and click generate to create content.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Save Content Dialog */}
			<Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Save Content</DialogTitle>
						<DialogDescription>
							{selectedInsight 
								? "The title has been pre-filled with your insight. You can edit it or use as is."
								: "Give your content a custom title or leave blank to use your topic."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={saveTitleId}>Title {selectedInsight ? "" : "(Optional)"}</Label>
							<Input
								id={saveTitleId}
								value={saveTitle}
								onChange={(e) => setSaveTitle(e.target.value)}
								placeholder={selectedInsight 
									? "Edit the insight title or use as is..."
									: "Enter a custom title or leave blank to use topic..."}
							/>
							<p className="text-xs text-muted-foreground">
								{selectedInsight 
									? "You can edit the title or keep the insight's title."
									: "If left blank, your topic/instructions will be used as the title."}
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setSaveDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={confirmSaveContent}
							disabled={saveContentMutation.isPending}
						>
							{saveContentMutation.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Training Feedback Dialog */}
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
							disabled={saveContentMutation.isPending}
						>
							{saveContentMutation.isPending
								? "Saving..."
								: "Save as Training Data"}
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

			{/* Insight Selection Dialog */}
			<Dialog open={insightDialogOpen} onOpenChange={setInsightDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Select Insight</DialogTitle>
						<DialogDescription>
							Choose an insight to include in your content generation.
						</DialogDescription>
					</DialogHeader>
					<div className="max-h-96 overflow-y-auto">
						{personaInsights && personaInsights.length > 0 ? (
							<Accordion type="multiple" className="w-full">
								{Object.entries(groupedInsights).map(([resourceTitle, insights]) => (
									<AccordionItem key={resourceTitle} value={resourceTitle}>
										<AccordionTrigger>
											<div className="flex items-center justify-between w-full mr-4">
												<span className="font-medium">{resourceTitle}</span>
												<span className="text-xs text-muted-foreground">
													{insights.length} insight{insights.length !== 1 ? 's' : ''}
												</span>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<div className="space-y-3">
												{insights.map((insight) => (
													<button
														key={insight.id}
														type="button"
														className="w-full border rounded-lg p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
														onClick={() => handleSelectInsight(insight.id.toString())}
														onKeyDown={(e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																e.preventDefault();
																handleSelectInsight(insight.id.toString());
															}
														}}
													>
														<div className="mb-2">
															<h4 className="font-medium">{insight.title}</h4>
														</div>
														<ul className="text-sm text-muted-foreground space-y-1">
															{typeof insight.keyPoints === "string"
																? JSON.parse(insight.keyPoints)
																		.slice(0, 3)
																		.map((point: string, pointIndex: number) => (
																			<li key={`${insight.id}-point-${pointIndex}`} className="flex items-start">
																				<span className="mr-2">•</span>
																				<span>{point}</span>
																			</li>
																		))
																: insight.keyPoints.slice(0, 3).map((point, pointIndex) => (
																		<li key={`${insight.id}-point-${pointIndex}`} className="flex items-start">
																			<span className="mr-2">•</span>
																			<span>{point}</span>
																		</li>
																	))}
															{(typeof insight.keyPoints === "string"
																? JSON.parse(insight.keyPoints).length > 3
																: insight.keyPoints.length > 3) && (
																<li className="text-xs italic">
																	...and{" "}
																	{typeof insight.keyPoints === "string"
																		? JSON.parse(insight.keyPoints).length - 3
																		: insight.keyPoints.length - 3}{" "}
																	more points
																</li>
															)}
														</ul>
													</button>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						) : (
							<div className="text-center py-8">
								<p className="text-muted-foreground">
									No insights available for this persona.
								</p>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setInsightDialogOpen(false)}
						>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
