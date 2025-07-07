import {
	IconBookmark,
	IconBrain,
	IconChevronLeft,
	IconLoader2,
	IconSparkles,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	const { resourceId } = useParams({
		from: "/app/creation/resources/$resourceId",
	});
	const queryClient = useQueryClient();
	const personaSelectId = useId();

	// State for dialogs and forms
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [insightSelectionDialogOpen, setInsightSelectionDialogOpen] =
		useState(false);
	const [selectedPersonaId, setSelectedPersonaId] = useState("");
	const [availableInsights, setAvailableInsights] = useState<ValueItem[]>([]);
	const [insightToDelete, setInsightToDelete] = useState<{
		id: number;
		title: string;
	} | null>(null);

	const resourceIdNum = parseInt(resourceId);

	// Fetch resource data
	const {
		data: resource,
		isLoading: isLoadingResource,
		error: resourceError,
	} = useQuery(
		trpc.resourceRouter.getResource.queryOptions({ id: resourceIdNum }),
	);

	// Fetch user data for personas
	const { data: userData } = useQuery(
		trpc.contentRouter.getUserData.queryOptions(),
	);

	// Extract insights mutation
	const extractInsightsMutation = useMutation(
		trpc.resourceRouter.extractInsights.mutationOptions({
			onSuccess: (insights) => {
				setAvailableInsights(insights);
				setInsightSelectionDialogOpen(true);
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
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.getResource.queryKey({
						id: resourceIdNum,
					}),
				});
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
				queryClient.invalidateQueries({
					queryKey: trpc.resourceRouter.getResource.queryKey({
						id: resourceIdNum,
					}),
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
		if (!selectedPersonaId) return;

		saveInsightMutation.mutate({
			resourceId: resourceIdNum,
			personaId: parseInt(selectedPersonaId),
			title: insight.title,
			keyPoints: insight.keyPoints,
			rawContent: insight.rawContent,
		});

		// Remove from available insights
		setAvailableInsights((prev) =>
			prev.filter((item) => item.title !== insight.title),
		);
	};

	const handleDiscardInsight = (insight: ValueItem) => {
		setAvailableInsights((prev) =>
			prev.filter((item) => item.title !== insight.title),
		);
	};

	const handleFinishInsightSelection = () => {
		setInsightSelectionDialogOpen(false);
		setAvailableInsights([]);
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

			{/* Tabbed Interface */}
			<Tabs
				defaultValue={resource.insights.length > 0 ? "insights" : "extraction"}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="insights">
						Insights ({resource.insights.length})
					</TabsTrigger>
					<TabsTrigger value="extraction">Extract New</TabsTrigger>
				</TabsList>

				{/* Insights Tab */}
				<TabsContent value="insights" className="mt-6">
					{resource.insights.length === 0 ? (
						<div className="rounded-lg border bg-background p-12 text-center">
							<p className="text-muted-foreground mb-4">
								No insights saved yet. Extract insights from this resource to
								get started.
							</p>
						</div>
					) : (
						<div className="divide-y divide-border rounded-lg border bg-background">
							<Accordion type="multiple" className="w-full">
								{resource.insights
									.sort((a, b) => {
										// Sort insights with generatedContentId to the end
										if (!a.generatedContentId && b.generatedContentId) return -1;
										if (a.generatedContentId && !b.generatedContentId) return 1;
										return 0; // Keep original order for same type
									})
									.map((insight) => (
									<AccordionItem key={insight.id} value={insight.id.toString()}>
										<AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
											<div className="flex items-center justify-between w-full mr-4">
												<div className="flex items-center gap-2">
													<span className="font-medium text-left">
														{insight.title}
													</span>
													{insight.generatedContentId && (
														<Link
															to="/app/creation/contents/$contentId"
															params={{ contentId: insight.generatedContentId.toString() }}
															onClick={(e) => e.stopPropagation()}
														>
															<Badge variant="secondary" className="text-xs hover:bg-secondary/80 transition-colors cursor-pointer">
																<IconSparkles className="h-3 w-3 mr-1" />
																Generated
															</Badge>
														</Link>
													)}
												</div>
												<span className="text-xs text-muted-foreground">
													{insight.persona?.name}
												</span>
											</div>
										</AccordionTrigger>
										<AccordionContent className="px-6 pb-4 pt-8">
											<div className="space-y-3">
												<ul className="text-sm text-muted-foreground space-y-1">
													{typeof insight.keyPoints === "string"
														? JSON.parse(insight.keyPoints).map(
																(point: string, pointIndex: number) => (
																	<li
																		key={`saved-${insight.id}-${pointIndex}-${point.slice(0, 20)}`}
																		className="flex items-start"
																	>
																		<span className="mr-2">•</span>
																		<span>{point}</span>
																	</li>
																),
															)
														: insight.keyPoints.map((point, pointIndex) => (
																<li
																	key={`saved-arr-${insight.id}-${pointIndex}-${point.slice(0, 20)}`}
																	className="flex items-start"
																>
																	<span className="mr-2">•</span>
																	<span>{point}</span>
																</li>
															))}
												</ul>
												<div className="flex justify-end">
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															handleDeleteInsight({
																id: insight.id,
																title: insight.title,
															})
														}
													>
														<IconTrash className="h-4 w-4 mr-1.5" />
														Delete
													</Button>
												</div>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</div>
					)}
				</TabsContent>

				{/* Extract New Tab */}
				<TabsContent value="extraction" className="mt-6">
					<div className="space-y-6">
						<div>
							<h2 className="text-xl font-semibold mb-2">
								Extract New Insights
							</h2>
							<p className="text-muted-foreground text-sm mb-6">
								Select a persona to extract valuable insights from this resource
								tailored to their specific needs and interests.
							</p>
						</div>

						<div className="space-y-4">
							<div>
								<label
									htmlFor={personaSelectId}
									className="text-sm font-medium mb-2 block"
								>
									Select Persona
								</label>
								<Select
									value={selectedPersonaId}
									onValueChange={setSelectedPersonaId}
								>
									<SelectTrigger id={personaSelectId}>
										<SelectValue placeholder="Choose a persona" />
									</SelectTrigger>
									<SelectContent>
										{userData?.personas?.map((persona) => (
											<SelectItem
												key={persona.id}
												value={persona.id.toString()}
											>
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
								disabled={
									!selectedPersonaId || extractInsightsMutation.isPending
								}
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
				</TabsContent>
			</Tabs>

			{/* Insight Selection Dialog */}
			<Dialog
				open={insightSelectionDialogOpen}
				onOpenChange={() => {}} // Disable closing by clicking outside
			>
				<DialogContent className="max-w-4xl max-h-[600px] flex flex-col">
					<DialogHeader>
						<DialogTitle>Review Extracted Insights</DialogTitle>
						<DialogDescription>
							Save the insights you want to keep or discard those you don't
							need.
						</DialogDescription>
					</DialogHeader>

					{availableInsights.length === 0 ? (
						<div className="flex-1 flex items-center justify-center py-8">
							<p className="text-muted-foreground">
								All insights have been processed. Click "Finish" to close.
							</p>
						</div>
					) : (
						<div className="flex-1 overflow-y-auto space-y-4 pr-2">
							{availableInsights.map((insight, index) => (
								<div
									key={`available-${index}-${insight.title}`}
									className="border rounded-lg p-4"
								>
									<div className="flex justify-between items-start mb-2">
										<h4 className="font-medium flex-1">{insight.title}</h4>
										<div className="flex items-center gap-2 ml-4">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleSaveInsight(insight)}
												disabled={saveInsightMutation.isPending}
											>
												<IconBookmark className="h-3 w-3 mr-1" />
												Save
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => handleDiscardInsight(insight)}
											>
												<IconTrash className="h-3 w-3 mr-1" />
												Discard
											</Button>
										</div>
									</div>
									<ul className="text-sm text-muted-foreground space-y-1">
										{insight.keyPoints.map((point, pointIndex) => (
											<li
												key={`insight-${index}-${pointIndex}-${point.slice(0, 20)}`}
												className="flex items-start"
											>
												<span className="mr-2">•</span>
												<span>{point}</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					)}

					<DialogFooter className="border-t pt-4 mt-4">
						<Button onClick={handleFinishInsightSelection} className="w-full">
							Finish Insight Selection
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
							Are you sure you want to delete "{insightToDelete?.title}"? This
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
