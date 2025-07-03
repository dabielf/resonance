import { IconArrowLeft, IconTrash } from "@tabler/icons-react";
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

export const Route = createFileRoute("/app/creation/personas/$personaId")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { personaId } = Route.useParams();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const nameId = useId();
	const descriptionId = useId();
	const contentId = useId();

	// Convert personaId to number
	const id = parseInt(personaId);

	// Fetch persona data
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.getPersona.queryOptions({ id }),
	);

	const persona = data?.success ? data.data : null;

	// Form state
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [content, setContent] = useState("");

	// Update form state when persona data loads
	useEffect(() => {
		if (persona) {
			setName(persona.name);
			setDescription(persona.description || "");
			setContent(persona.content);
		}
	}, [persona]);

	// Update mutation
	const updatePersonaMutation = useMutation(
		trpc.contentRouter.updatePersona.mutationOptions({
			onSuccess: () => {
				toast.success("Persona updated successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPersonas.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getPersona.queryKey({ id }),
				});
				navigate({ to: "/app/creation/personas" });
			},
			onError: () => {
				toast.error("Failed to update persona");
			},
		}),
	);

	// Delete mutation
	const deletePersonaMutation = useMutation(
		trpc.contentRouter.deletePersona.mutationOptions({
			onSuccess: () => {
				toast.success("Persona deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPersonas.queryKey(),
				});
				navigate({ to: "/app/creation/personas" });
			},
			onError: () => {
				toast.error("Failed to delete persona");
			},
		}),
	);

	const handleSave = () => {
		if (!name.trim()) {
			toast.error("Please provide a name for the persona");
			return;
		}

		if (!content.trim()) {
			toast.error("Please provide content for the persona");
			return;
		}

		updatePersonaMutation.mutate({
			id,
			name: name.trim(),
			description: description.trim() || undefined,
			content: content.trim(),
		});
	};

	const handleDelete = () => {
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		deletePersonaMutation.mutate({ id });
	};

	const handleBack = () => {
		navigate({ to: "/app/creation/personas" });
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-4 max-w-3xl">
				<Skeleton className="h-10 w-32 mb-6" />
				<Skeleton className="h-8 w-48 mb-2" />
				<Skeleton className="h-4 w-64 mb-6" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (error || !persona) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						{error ? "Failed to load persona." : "Persona not found."}
					</p>
					<Button onClick={handleBack}>Back to Personas</Button>
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
					Back to Personas
				</Button>
				<div className="flex justify-between items-start">
					<div>
						<h1 className="text-3xl font-bold">Edit Persona</h1>
						<p className="text-muted-foreground mt-1">
							Modify your persona definition
						</p>
					</div>
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

			{/* Tabs */}
			<Tabs defaultValue="edit" className="space-y-4">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="edit">Edit</TabsTrigger>
					<TabsTrigger value="preview">Preview</TabsTrigger>
				</TabsList>

				<TabsContent value="edit" className="space-y-6 max-w-2xl mx-auto">
					<div className="space-y-2">
						<Label htmlFor={nameId}>Name *</Label>
						<Input
							id={nameId}
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="text-base"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={descriptionId}>Description (Optional)</Label>
						<Textarea
							id={descriptionId}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="min-h-[80px] resize-none"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={contentId}>Persona Content *</Label>
						<Textarea
							id={contentId}
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="min-h-[400px] font-mono text-sm"
							required
						/>
						<p className="text-sm text-muted-foreground">
							Use markdown formatting to structure your persona definition.
						</p>
					</div>

					{/* Save Button */}
					<div className="flex justify-end pt-4 border-t">
						<Button
							onClick={handleSave}
							disabled={updatePersonaMutation.isPending}
						>
							{updatePersonaMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</TabsContent>

				<TabsContent value="preview" className="space-y-4">
					<div className="rounded-lg border bg-muted/50 p-6 max-w-2xl mx-auto">
						<h3 className="text-lg font-semibold mb-2">{name}</h3>
						{description && (
							<p className="text-sm text-muted-foreground mb-4">
								{description}
							</p>
						)}
						<div className="prose prose-sm dark:prose-invert">
							<ReactMarkdown>{content}</ReactMarkdown>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Persona</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{persona.name}"? This action
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
							disabled={deletePersonaMutation.isPending}
						>
							{deletePersonaMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
