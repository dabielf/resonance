import {
	IconBrain,
	IconDots,
	IconEdit,
	IconPlus,
	IconTrash,
	IconUser,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Ghostwriter } from "@worker/types/gw";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/writers/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	// Fetch writers using TRPC
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.listGhostwriters.queryOptions(),
	);

	const writers = data?.success ? data.data : [];

	const handleCreateWriter = () => {
		navigate({ to: "/app/creation/writers/new" });
	};

	const handleEditWriter = (writerId: number) => {
		// TODO: Navigate to edit page when implemented
		console.log("Edit writer:", writerId);
	};

	const handleDeleteWriter = (writerId: number) => {
		// TODO: Implement delete functionality
		console.log("Delete writer:", writerId);
	};

	const handleGenerateContent = (writerId: number) => {
		// TODO: Navigate to content generation when implemented
		console.log("Generate content for writer:", writerId);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-4 space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-48 mb-2" />
						<Skeleton className="h-4 w-64" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<div className="divide-y divide-border rounded-lg border bg-background">
					{["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
						<div key={key} className="flex items-center gap-6 px-6 py-5">
							<div className="flex-1">
								<Skeleton className="h-4 w-32 mb-2" />
								<Skeleton className="h-3 w-48" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-7 w-24" />
								<Skeleton className="h-7 w-20" />
							</div>
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-8 w-8 rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground">
						Failed to load writers. Please try again.
					</p>
					<Button className="mt-4" onClick={() => window.location.reload()}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	// Empty state
	if (writers.length === 0) {
		return (
			<div className="container mx-auto p-4">
				<div className="flex justify-between items-center mb-6">
					<div>
						<h1 className="text-3xl font-bold">Your Writers</h1>
						<p className="text-muted-foreground mt-1">
							Create AI writers that learn your unique voice and style
						</p>
					</div>
					<Button onClick={handleCreateWriter}>
						<IconPlus className="h-4 w-4 mr-2" />
						Create Writer
					</Button>
				</div>

				<div className="rounded-lg border bg-background p-12 text-center">
					<div className="max-w-md mx-auto">
						<IconUser className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No writers yet</h3>
						<p className="text-muted-foreground mb-6">
							Get started by creating your first AI writer. Upload your writing
							samples and let AI learn your unique voice and style.
						</p>
						<Button onClick={handleCreateWriter} size="lg">
							<IconPlus className="h-4 w-4 mr-2" />
							Create Your First Writer
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Your Writers</h1>
					<p className="text-muted-foreground mt-1">
						Manage your AI writers and their profiles
						<span className="ml-2 text-sm">
							({writers.length} writer{writers.length !== 1 ? "s" : ""})
						</span>
					</p>
				</div>
				<Button onClick={handleCreateWriter}>
					<IconPlus className="h-4 w-4 mr-2" />
					Create Writer
				</Button>
			</div>

			{/* Writers List */}
			<div className="divide-y divide-border bg-background">
				{writers.map((writer: Ghostwriter, index: number) => {
					const hasPsyProfile = writer.psyProfileId !== null;
					const hasWritingProfile = writer.writingProfileId !== null;
					const isComplete = hasPsyProfile && hasWritingProfile;

					return (
						<div
							key={writer.id}
							className={`group flex items-center gap-6 py-5 transition-colors hover:bg-muted/50 cursor-pointer ${
								index % 2 === 1 ? "bg-muted/10" : ""
							}`}
						>
							{/* Writer Info */}
							<div className="flex-2 min-w-0">
								<h3 className="text-base font-medium leading-none">
									{writer.name}
								</h3>
								{writer.description && (
									<p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
										{writer.description}
									</p>
								)}
							</div>

							{/* Actions */}
							<div className="flex items-center gap-2">
								{isComplete && (
									<Button
										size="sm"
										variant="default"
										onClick={(e) => {
											e.stopPropagation();
											handleGenerateContent(writer.id);
										}}
									>
										<IconBrain className="h-4 w-4 mr-1.5" />
										Generate
									</Button>
								)}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => e.stopPropagation()}
										>
											<IconDots className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => handleEditWriter(writer.id)}
										>
											<IconEdit className="h-4 w-4 mr-2" />
											Edit Writer
										</DropdownMenuItem>
										{!isComplete && (
											<DropdownMenuItem
												onClick={() =>
													console.log("Create profiles", writer.id)
												}
											>
												<IconPlus className="h-4 w-4 mr-2" />
												Create Missing Profiles
											</DropdownMenuItem>
										)}
										<DropdownMenuItem
											onClick={() => handleDeleteWriter(writer.id)}
											className="text-destructive"
										>
											<IconTrash className="h-4 w-4 mr-2" />
											Delete Writer
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
