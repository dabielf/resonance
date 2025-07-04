import {
	IconBrain,
	IconChevronLeft,
	IconLoader2,
	IconPlus,
	IconBookmark,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/resources/$resourceId")({
	component: ResourceDetailPage,
});

interface ValueItem {
	title: string;
	keyPoints: string[];
	rawContent: string;
}

export default function ResourceDetailPage() {
	const { resourceId } = useParams({ from: "/app/creation/resources/$resourceId" });
	const queryClient = useQueryClient();

	// State for dialogs and forms
	const [extractDialogOpen, setExtractDialogOpen] = useState(false);
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedPersonaId, setSelectedPersonaId] = useState("");
	const [extractedInsights, setExtractedInsights] = useState<ValueItem[]>([]);
	const [insightToSave, setInsightToSave] = useState<ValueItem | null>(null);
	const [insightToDelete, setInsightToDelete] = useState<{ id: number; title: string } | null>(null);

	const resourceIdNum = parseInt(resourceId);

	// Fetch resource data
	const {
		data: resource,
		isLoading: isLoadingResource,
		error: resourceError,
	} = useQuery(trpc.resourceRouter.getResource.queryOptions({ id: resourceIdNum }));

	// Fetch user data for personas
	const { data: userData } = useQuery(trpc.contentRouter.getUserData.queryOptions());

	// Extract insights mutation
	const extractInsightsMutation = useMutation(
		trpc.resourceRouter.extractInsights.mutationOptions({
			onSuccess: (insights) => {
				setExtractedInsights(insights);
				if (insights.length === 0) {
					toast.info("No insights were extracted for this persona");
				} else {
					toast.success(`Extracted ${insights.length} insights`);
				}
			},
			onError: (error) => {
				if (error.message.includes("MISSING_API_KEY")) {
					toast.error("API key required. Please check your settings.");
				} else {
					toast.error("Failed to extract insights");
				}
				console.error("Extract insights failed:", error);
			},
		}),
	);

	// Save insight mutation
	const saveInsightMutation = useMutation(
		trpc.resourceRouter.saveInsight.mutationOptions({
			onSuccess: () => {
				toast.success("Insight saved successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.getResource.queryKey({ id: resourceIdNum }),
				});
				setSaveDialogOpen(false);
				setInsightToSave(null);
			},
			onError: () => {
				toast.error("Failed to save insight");
			},
		}),
	);

	// Delete insight mutation
	const deleteInsightMutation = useMutation(
		trpc.resourceRouter.deleteInsight.mutationOptions({
			onSuccess: () => {
				toast.success("Insight deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.getResource.queryKey({ id: resourceIdNum }),
				});
				setDeleteDialogOpen(false);
				setInsightToDelete(null);
			},
			onError: () => {
				toast.error("Failed to delete insight");
			},
		}),
	);

	// Event handlers
	const handleExtractInsights = () => {
		if (!selectedPersonaId) {
			toast.error("Please select a persona");
			return;
		}

		extractInsightsMutation.mutate({
			resourceId: resourceIdNum,
			personaId: parseInt(selectedPersonaId),
		});
	};

	const handleSaveInsight = (insight: ValueItem) => {
		setInsightToSave(insight);
		setSaveDialogOpen(true);
	};

	const confirmSaveInsight = () => {
		if (!insightToSave || !selectedPersonaId) return;

		saveInsightMutation.mutate({
			resourceId: resourceIdNum,
			personaId: parseInt(selectedPersonaId),
			title: insightToSave.title,
			keyPoints: insightToSave.keyPoints,
			rawContent: insightToSave.rawContent,
		});
	};

	const handleDeleteInsight = (insight: { id: number; title: string }) => {
		setInsightToDelete(insight);
		setDeleteDialogOpen(true);
	};

	const confirmDeleteInsight = () => {
		if (insightToDelete) {
			deleteInsightMutation.mutate({ id: insightToDelete.id });
		}
	};

	// Loading state
	if (isLoadingResource) {
		return (
			<div className="container mx-auto p-2 lg:p-4 space-y-6">
				<div className="flex items-center gap-4 mb-6">
					<Skeleton className="h-10 w-10" />
					<div>
						<Skeleton className="h-8 w-64 mb-2" />
						<Skeleton className="h-4 w-96" />
					</div>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="space-y-6">
						<Skeleton className="h-40 w-full rounded-lg" />
						<Skeleton className="h-32 w-full rounded-lg" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-32 w-full rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (resourceError || !resource) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						Resource not found or failed to load. Please try again.
					</p>
					<Link to="/app/creation/resources">
						<Button>Back to Resources</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-2 lg:p-4 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link to="/app/creation/resources">
					<Button variant="outline" size="sm">
						<IconChevronLeft className="h-4 w-4" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">{resource.title}</h1>
					<div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
						<span>
							{resource.insights.length}{" "}
							{resource.insights.length === 1 ? "insight" : "insights"}
						</span>
						<span>
							Added {new Date(resource.createdAt).toLocaleDateString()}
						</span>
						{resource.author && <span>by {resource.author}</span>}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left Column: Insight Extraction */}
				<div className="space-y-6">
					{/* Extract Insights Section */}
					<div className="rounded-lg border bg-background p-6">
						<h2 className="text-xl font-semibold mb-4">Extract Insights</h2>
						<p className="text-muted-foreground text-sm mb-4">
							Select a persona to extract valuable insights from this resource
							tailored to their specific needs and interests.
						</p>

						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium mb-2 block">
									Select Persona
								</label>
								<Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
									<SelectTrigger>
										<SelectValue placeholder="Choose a persona" />
									</SelectTrigger>
									<SelectContent>
										{userData?.personas?.map((persona) => (
											<SelectItem key={persona.id} value={persona.id.toString()}>
												{persona.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{!userData?.personas?.length && (
									<p className="text-xs text-muted-foreground mt-1">
										No personas found.{" "}
										<Link
											to="/app/creation/personas"
											className="text-primary hover:underline"
										>
											Create a persona first
										</Link>
										.
									</p>
								)}
							</div>

							<Button
								onClick={handleExtractInsights}
								disabled={!selectedPersonaId || extractInsightsMutation.isPending}
								className="w-full"
							>
								{extractInsightsMutation.isPending ? (
									<>
										<IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
										Extracting Insights...
									</>
								) : (
									<>
										<IconBrain className="h-4 w-4 mr-2" />
										Extract Insights
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Extracted Insights Results */}
					{extractedInsights.length > 0 && (
						<div className="rounded-lg border bg-background p-6">
							<h3 className="text-lg font-semibold mb-4">
								Extracted Insights ({extractedInsights.length})
							</h3>
							<div className="space-y-4">
								{extractedInsights.map((insight, index) => (
									<div key={index} className="border rounded-lg p-4">
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-medium">{insight.title}</h4>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleSaveInsight(insight)}
											>
												<IconBookmark className="h-3 w-3 mr-1" />
												Save
											</Button>
										</div>
										<ul className="text-sm text-muted-foreground space-y-1">
											{insight.keyPoints.map((point, pointIndex) => (
												<li key={pointIndex} className="flex items-start">
													<span className="mr-2">•</span>
													<span>{point}</span>
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right Column: Saved Insights */}
				<div className="space-y-6">
					<div className="rounded-lg border bg-background p-6">
						<h2 className="text-xl font-semibold mb-4">Saved Insights</h2>
						
						{resource.insights.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-muted-foreground mb-4">
									No insights saved yet. Extract insights from this resource to get started.
								</p>
								<Button
									variant="outline"
									onClick={() => setExtractDialogOpen(true)}
								>
									<IconPlus className="h-4 w-4 mr-2" />
									Extract First Insight
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{resource.insights.map((insight) => (
									<div key={insight.id} className="border rounded-lg p-4">
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-medium">{insight.title}</h4>
											<div className="flex items-center gap-2">
												<span className="text-xs text-muted-foreground">
													{insight.persona?.name}
												</span>
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleDeleteInsight({
														id: insight.id,
														title: insight.title
													})}
												>
													<IconTrash className="h-3 w-3" />
												</Button>
											</div>
										</div>
										<ul className="text-sm text-muted-foreground space-y-1">
											{typeof insight.keyPoints === 'string' 
												? JSON.parse(insight.keyPoints).map((point: string, pointIndex: number) => (
													<li key={pointIndex} className="flex items-start">
														<span className="mr-2">•</span>
														<span>{point}</span>
													</li>
												))
												: insight.keyPoints.map((point, pointIndex) => (
													<li key={pointIndex} className="flex items-start">
														<span className="mr-2">•</span>
														<span>{point}</span>
													</li>
												))
											}
										</ul>
										<p className="text-xs text-muted-foreground mt-2">
											Saved {new Date(insight.createdAt).toLocaleDateString()}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Save Insight Dialog */}
			<Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Save Insight</DialogTitle>
						<DialogDescription>
							Save this insight to your collection for future reference.
						</DialogDescription>
					</DialogHeader>
					{insightToSave && (
						<div className="space-y-2">
							<h4 className="font-medium">{insightToSave.title}</h4>
							<ul className="text-sm text-muted-foreground space-y-1">
								{insightToSave.keyPoints.map((point, index) => (
									<li key={index} className="flex items-start">
										<span className="mr-2">•</span>
										<span>{point}</span>
									</li>
								))}
							</ul>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={confirmSaveInsight}
							disabled={saveInsightMutation.isPending}
						>
							{saveInsightMutation.isPending ? "Saving..." : "Save Insight"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Insight Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Insight</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{insightToDelete?.title}"?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDeleteInsight}
							disabled={deleteInsightMutation.isPending}
						>
							{deleteInsightMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}