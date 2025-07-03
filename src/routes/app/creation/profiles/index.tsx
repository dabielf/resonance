import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/router";

export const Route = createFileRoute("/app/creation/profiles/")({
	component: RouteComponent,
});

type ProfileTab = "psychology" | "writing";

type ProfileListProps = {
	profiles: Array<{
		id: number;
		name: string;
		ghostwriterId: number | null;
	}>;
	type: ProfileTab;
	getWriterName: (ghostwriterId: number | null) => string | null;
	onViewProfile: (profileId: number, type: ProfileTab) => void;
	onEditProfile: (profileId: number, type: ProfileTab) => void;
	onDeleteProfile: (
		profile: { id: number; name: string },
		type: ProfileTab,
	) => void;
};

const ProfileList = ({
	profiles,
	type,
	getWriterName,
	onViewProfile,
	onEditProfile,
	onDeleteProfile,
}: ProfileListProps) => {
	if (profiles.length === 0) {
		return (
			<div className="rounded-lg border bg-background p-12 text-center">
				<p className="text-muted-foreground">
					No {type} profiles yet. Create profiles from your writers or content
					samples.
				</p>
			</div>
		);
	}

	return (
		<div className="divide-y divide-border rounded-lg border bg-background">
			{profiles.map((profile) => {
				const writerName = getWriterName(profile.ghostwriterId);
				return (
					<div
						key={profile.id}
						className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
					>
						<div className="flex-1 min-w-0">
							<h3 className="text-base font-medium leading-none">
								{profile.name}
							</h3>
							{writerName && (
								<p className="text-sm text-muted-foreground mt-1.5">
									Writer: {writerName}
								</p>
							)}
						</div>
						<div className="flex items-center gap-2 ml-4">
							<Button
								size="sm"
								variant="outline"
								onClick={() => onViewProfile(profile.id, type)}
							>
								<IconEye className="h-4 w-4 mr-1.5" />
								View
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => onEditProfile(profile.id, type)}
							>
								<IconEdit className="h-4 w-4 mr-1.5" />
								Edit
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => onDeleteProfile(profile, type)}
							>
								<IconTrash className="h-4 w-4 mr-1.5" />
								Delete
							</Button>
						</div>
					</div>
				);
			})}
		</div>
	);
};

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<ProfileTab>("psychology");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [profileToDelete, setProfileToDelete] = useState<{
		id: number;
		name: string;
		type: ProfileTab;
	} | null>(null);

	// Fetch profiles
	const {
		data: psyData,
		isLoading: psyLoading,
		error: psyError,
	} = useQuery(trpc.contentRouter.listPsyProfiles.queryOptions());

	const {
		data: writingData,
		isLoading: writingLoading,
		error: writingError,
	} = useQuery(trpc.contentRouter.listWritingProfiles.queryOptions());

	// Get ghostwriters to show writer names
	const { data: writersData } = useQuery(
		trpc.contentRouter.listGhostwriters.queryOptions(),
	);

	const psyProfiles = psyData?.success ? psyData.data : [];
	const writingProfiles = writingData?.success ? writingData.data : [];
	const writers = writersData?.success ? writersData.data : [];

	// Delete mutations
	const deletePsyProfileMutation = useMutation(
		trpc.contentRouter.deletePsyProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Psychology profile deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listPsyProfiles.queryKey(),
				});
				setDeleteDialogOpen(false);
				setProfileToDelete(null);
			},
			onError: () => {
				toast.error("Failed to delete psychology profile");
			},
		}),
	);

	const deleteWritingProfileMutation = useMutation(
		trpc.contentRouter.deleteWritingProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Writing profile deleted successfully");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listWritingProfiles.queryKey(),
				});
				setDeleteDialogOpen(false);
				setProfileToDelete(null);
			},
			onError: () => {
				toast.error("Failed to delete writing profile");
			},
		}),
	);

	const handleViewProfile = (profileId: number, type: ProfileTab) => {
		navigate({
			to:
				type === "psychology"
					? "/app/creation/profiles/psy/$profileId"
					: "/app/creation/profiles/writing/$profileId",
			params: { profileId: profileId.toString() },
		});
	};

	const handleEditProfile = (profileId: number, type: ProfileTab) => {
		// For now, redirect to view page where editing is available
		handleViewProfile(profileId, type);
	};

	const handleDeleteProfile = (
		profile: { id: number; name: string },
		type: ProfileTab,
	) => {
		setProfileToDelete({ ...profile, type });
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (!profileToDelete) return;

		if (profileToDelete.type === "psychology") {
			deletePsyProfileMutation.mutate({ id: profileToDelete.id });
		} else {
			deleteWritingProfileMutation.mutate({ id: profileToDelete.id });
		}
	};

	const getWriterName = (ghostwriterId: number | null) => {
		if (!ghostwriterId) return null;
		const writer = writers.find((w) => w.id === ghostwriterId);
		return writer?.name || null;
	};

	// Loading state
	if (psyLoading || writingLoading) {
		return (
			<div className="container mx-auto p-2 lg:p-4 space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<Skeleton className="h-8 w-48 mb-2" />
						<Skeleton className="h-4 w-64" />
					</div>
				</div>
				<Skeleton className="h-10 w-64" />
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
								<Skeleton className="h-9 w-20" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Error state
	if (psyError || writingError) {
		return (
			<div className="container mx-auto p-2 lg:p-4">
				<div className="rounded-lg border bg-background p-12 text-center">
					<p className="text-muted-foreground mb-4">
						Failed to load profiles. Please try again.
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
					<h1 className="text-3xl font-bold">Profiles</h1>
					<p className="text-muted-foreground mt-1">
						Manage your psychological and writing style profiles
					</p>
				</div>
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as ProfileTab)}
			>
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="psychology">
						Psychological ({psyProfiles.length})
					</TabsTrigger>
					<TabsTrigger value="writing">
						Writing Style ({writingProfiles.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="psychology" className="mt-6">
					<ProfileList
						profiles={psyProfiles}
						type="psychology"
						getWriterName={getWriterName}
						onViewProfile={handleViewProfile}
						onEditProfile={handleEditProfile}
						onDeleteProfile={handleDeleteProfile}
					/>
				</TabsContent>

				<TabsContent value="writing" className="mt-6">
					<ProfileList
						profiles={writingProfiles}
						type="writing"
						getWriterName={getWriterName}
						onViewProfile={handleViewProfile}
						onEditProfile={handleEditProfile}
						onDeleteProfile={handleDeleteProfile}
					/>
				</TabsContent>
			</Tabs>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Profile</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{profileToDelete?.name}"? This
							will remove the profile from any associated writers and content.
							This action cannot be undone.
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
							disabled={
								deletePsyProfileMutation.isPending ||
								deleteWritingProfileMutation.isPending
							}
						>
							{deletePsyProfileMutation.isPending ||
							deleteWritingProfileMutation.isPending
								? "Deleting..."
								: "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
