import {
	IconBrain,
	IconChevronDown,
	IconDots,
	IconEdit,
	IconPlus,
	IconTrash,
	IconUser,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";
import type { Ghostwriter } from "@worker/types/gw";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/writers/")({
	component: RouteComponent,
});

// Create Writer Button Component
function CreateWriterButton({ 
	psyProfiles, 
	writingProfiles, 
	onCreateFromContent, 
	onCreateFromProfiles 
}: {
	psyProfiles: { id: number; name: string }[];
	writingProfiles: { id: number; name: string }[];
	onCreateFromContent: () => void;
	onCreateFromProfiles: () => void;
}) {
	const hasProfiles = psyProfiles.length > 0 && writingProfiles.length > 0;

	if (hasProfiles) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button>
						<IconPlus className="h-4 w-4 mr-2" />
						Create Writer
						<IconChevronDown className="h-4 w-4 ml-2" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={onCreateFromContent}>
						<IconPlus className="h-4 w-4 mr-2" />
						Create from content
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onCreateFromProfiles}>
						<IconUser className="h-4 w-4 mr-2" />
						Create from existing profiles
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<Button onClick={onCreateFromContent}>
			<IconPlus className="h-4 w-4 mr-2" />
			Create Writer
		</Button>
	);
}

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const nameId = useId();
	const descriptionId = useId();

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		psyProfileId: "",
		writingProfileId: "",
		basePersonaId: "",
	});

	// Fetch writers using TRPC
	const { data, isLoading, error } = useQuery(
		trpc.contentRouter.listGhostwriters.queryOptions(),
	);

	// Fetch user data for profiles
	const { data: userData } = useQuery(
		trpc.contentRouter.getUserData.queryOptions(),
	);

	const writers = data || [];
	const psyProfiles = userData?.psyProfiles || [];
	const writingProfiles = userData?.writingProfiles || [];
	const personas = userData?.personas || [];

	// Mutation for creating writer with profiles
	const createWriterMutation = useMutation(
		trpc.contentRouter.createWriterWithProfiles.mutationOptions({
			onSuccess: () => {
				toast.success("Writer created successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGhostwriters.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.getUserData.queryKey(),
				});
				setDialogOpen(false);
				setFormData({
					name: "",
					description: "",
					psyProfileId: "",
					writingProfileId: "",
					basePersonaId: "",
				});
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create writer");
			},
		}),
	);

	const handleCreateWriter = () => {
		navigate({ to: "/app/creation/writers/new" });
	};

	const handleCreateFromProfiles = () => {
		setDialogOpen(true);
	};

	const handleFormSubmit = () => {
		if (!formData.name.trim() || !formData.psyProfileId || !formData.writingProfileId) {
			toast.error("Please fill in all required fields");
			return;
		}

		createWriterMutation.mutate({
			name: formData.name.trim(),
			description: formData.description.trim() || undefined,
			psyProfileId: parseInt(formData.psyProfileId),
			writingProfileId: parseInt(formData.writingProfileId),
			basePersonaId: formData.basePersonaId && formData.basePersonaId !== "-1" ? parseInt(formData.basePersonaId) : undefined,
		});
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
		navigate({ 
			to: "/app/creation/create", 
			search: { gwId: writerId.toString() } 
		});
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
					<CreateWriterButton 
						psyProfiles={psyProfiles}
						writingProfiles={writingProfiles}
						onCreateFromContent={handleCreateWriter}
						onCreateFromProfiles={handleCreateFromProfiles}
					/>
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
				<CreateWriterButton 
					psyProfiles={psyProfiles}
					writingProfiles={writingProfiles}
					onCreateFromContent={handleCreateWriter}
					onCreateFromProfiles={handleCreateFromProfiles}
				/>
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
							onClick={() => navigate({ to: "/app/creation/writers/$writerId", params: { writerId: writer.id.toString() } })}
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

			{/* Create Writer from Profiles Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Create Writer from Existing Profiles</DialogTitle>
						<DialogDescription>
							Create a new writer using your existing psychology and writing profiles.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={nameId}>Name *</Label>
							<Input
								id={nameId}
								placeholder="Enter writer name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={descriptionId}>Description</Label>
							<Textarea
								id={descriptionId}
								placeholder="Optional description"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="psyProfile">Psychology Profile *</Label>
							<Select
								value={formData.psyProfileId}
								onValueChange={(value) => setFormData({ ...formData, psyProfileId: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select psychology profile" />
								</SelectTrigger>
								<SelectContent>
									{psyProfiles.map((profile) => (
										<SelectItem key={profile.id} value={profile.id.toString()}>
											{profile.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="writingProfile">Writing Profile *</Label>
							<Select
								value={formData.writingProfileId}
								onValueChange={(value) => setFormData({ ...formData, writingProfileId: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select writing profile" />
								</SelectTrigger>
								<SelectContent>
									{writingProfiles.map((profile) => (
										<SelectItem key={profile.id} value={profile.id.toString()}>
											{profile.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="basePersona">Base Persona (Optional)</Label>
							<Select
								value={formData.basePersonaId}
								onValueChange={(value) => setFormData({ ...formData, basePersonaId: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select base persona (optional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="-1">None</SelectItem>
									{personas.map((persona) => (
										<SelectItem key={persona.id} value={persona.id.toString()}>
											{persona.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button 
							onClick={handleFormSubmit}
							disabled={createWriterMutation.isPending}
						>
							{createWriterMutation.isPending ? "Creating..." : "Create Writer"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
