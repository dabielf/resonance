import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Persona } from "@worker/types/gw";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/personas/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);

	// Fetch personas using TRPC
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.listPersonas.queryOptions(),
	);

	const personas = data || [];

	// Delete mutation
	const deletePersonaMutation = useMutation(
		trpc.contentRouter.deletePersona.mutationOptions({
			onSuccess: () => {
				toast.success("Persona deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPersonas.queryKey(),
				});
				setDeleteDialogOpen(false);
				setPersonaToDelete(null);
			},
			onError: () => {
				toast.error("Failed to delete persona");
			},
		}),
	);

	const handleCreatePersona = () => {
		navigate({ to: "/app/creation/personas/new" });
	};

	const handleEditPersona = (personaId: number) => {
		navigate({
			to: `/app/creation/personas/$personaId`,
			params: { personaId: personaId.toString() },
		});
	};

	const handleDeletePersona = (persona: Persona) => {
		setPersonaToDelete(persona);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (personaToDelete) {
			deletePersonaMutation.mutate({ id: personaToDelete.id });
		}
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
				<div className="divide-y divide-border rounded-lg border bg-background">
					{["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
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

	if (error) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground">
						Failed to load personas. Please try again.
					</p>
					<Button className="mt-4" onClick={() => window.location.reload()}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-2 lg:p-4 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Personas</h1>
					<p className="text-muted-foreground mt-1">
						Manage your personas for content generation
					</p>
				</div>
				<Button onClick={handleCreatePersona}>
					<IconPlus className="h-4 w-4 mr-2" />
					Add Persona
				</Button>
			</div>

			{/* Personas List */}
			{personas.length === 0 ? (
				<div className="rounded-lg border bg-background p-12 text-center">
					<div className="max-w-md mx-auto">
						<h3 className="text-lg font-semibold mb-2">No personas yet</h3>
						<p className="text-muted-foreground mb-6">
							Create personas to give your AI-generated content specific
							perspectives and voices.
						</p>
						<Button onClick={handleCreatePersona} size="lg">
							<IconPlus className="h-4 w-4 mr-2" />
							Create Your First Persona
						</Button>
					</div>
				</div>
			) : (
				<div className="divide-y divide-border rounded-lg border bg-background">
					{personas.map((persona: Persona) => (
						<div
							key={persona.id}
							className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
						>
							<div className="flex-1 min-w-0">
								<h3 className="text-base font-medium leading-none">
									{persona.name}
								</h3>
								{persona.description && (
									<p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
										{persona.description}
									</p>
								)}
								<p className="text-xs text-muted-foreground mt-1">
									Created {new Date(persona.createdAt).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-center gap-2 ml-4">
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleEditPersona(persona.id)}
								>
									<IconEdit className="h-4 w-4 mr-1.5" />
									Edit
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleDeletePersona(persona)}
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
						<DialogTitle>Delete Persona</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{personaToDelete?.name}"? This
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
