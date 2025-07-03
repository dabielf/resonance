import {
	IconBookmark,
	IconBrain,
	IconCopy,
	IconDots,
	IconDownload,
	IconEdit,
	IconEye,
	IconLoader2,
	IconSettings,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	const queryClient = useQueryClient();

	// State management
	const [mode, setMode] = useState<GenerationMode>("writer");
	const [selectedWriterId, setSelectedWriterId] = useState<string>("");
	const [selectedPsyProfileId, setSelectedPsyProfileId] = useState<string>("");
	const [selectedWritingProfileId, setSelectedWritingProfileId] =
		useState<string>("");
	const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
	const [selectedInsightId] = useState<string>("");
	const [topic, setTopic] = useState("");
	const [generatedContent, setGeneratedContent] = useState<string | null>(null);
	const [contentMode, setContentMode] = useState<ContentMode>("display");
	const [editedContent, setEditedContent] = useState<string>("");

	// Training dialog state
	const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
	const [userFeedback, setUserFeedback] = useState("");

	// Fetch user data
	const {
		data: userData,
		isLoading: isLoadingData,
		error: dataError,
	} = useQuery(trpc.contentRouter.getUserData.queryOptions());

	const user = userData?.success ? userData.data : null;

	// Filter complete writers (those with both profiles)
	const completeWriters =
		user?.ghostwriters?.filter(
			(writer) => writer.psyProfileId && writer.writingProfileId,
		) || [];

	// Generate content mutation
	const generateContentMutation = useMutation(
		trpc.contentRouter.generateContent.mutationOptions({
			onSuccess: (data) => {
				if (data.success) {
					setGeneratedContent(data.data);
					setEditedContent(data.data);
					setContentMode("display");
				}
			},
			onError: (error) => {
				console.error("Generation failed:", error);
			},
		}),
	);

	// Save content mutation
	const saveContentMutation = useMutation(
		trpc.contentRouter.saveGeneratedContent.mutationOptions({
			onSuccess: (data) => {
				if (data.success) {
					toast.success("Content saved successfully");
					queryClient.invalidateQueries({
						queryKey: trpc.contentRouter.listGeneratedContents.queryKey(),
					});
				}
			},
			onError: (error) => {
				toast.error("Failed to save content");
				console.error("Save failed:", error);
			},
		}),
	);

	// Handle form submission
	const handleGenerate = () => {
		if (!topic.trim()) return;

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
		if (!topic.trim()) return false;

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
	const handleSaveContent = (isTrainingData: boolean, feedback?: string) => {
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
			prompt: topic.trim(),
			userFeedback: feedback,
			isTrainingData,
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

						{/* Persona Selector (Placeholder) */}
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
							<Select
								value={selectedPersonaId}
								onValueChange={setSelectedPersonaId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose persona" />
								</SelectTrigger>
								<SelectContent>
									{user?.personas?.map((persona) => (
										<SelectItem key={persona.id} value={persona.id.toString()}>
											{persona.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Topic Input */}
						<div>
							<label
								htmlFor={topicInputId}
								className="text-sm font-medium mb-3 block"
							>
								Topic <span className="text-destructive">*</span>
							</label>
							<Textarea
								id={topicInputId}
								value={topic}
								onChange={(e) => setTopic(e.target.value)}
								placeholder="What would you like to write about?"
								className="min-h-[100px] resize-none"
							/>
						</div>

						{/* Insights Selector (Placeholder) */}
						<div>
							<label
								htmlFor="insights-select"
								className="text-sm font-medium mb-3 block"
							>
								Insights{" "}
								<span className="text-xs text-muted-foreground">
									(Coming soon)
								</span>
							</label>
							<Select disabled>
								<SelectTrigger>
									<SelectValue placeholder="Choose insights" />
								</SelectTrigger>
							</Select>
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
									<h3 className="font-medium">Generated Content</h3>
									<div className="flex items-center gap-3">
										{/* Actions Menu */}
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													disabled={saveContentMutation.isPending}
												>
													Save...
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => handleSaveContent(false)}
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
		</div>
	);
}
