import { useUser } from "@clerk/clerk-react";
import {
	IconAddressBook,
	IconFilePlus,
	IconFolder,
	IconInnerShadowTop,
	IconSettings,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Creation",
			url: "/app/creation",
			icon: IconFilePlus,
			items: [
				{
					title: "Writers",
					url: "/app/creation/writers",
				},
				{
					title: "Generate",
					url: "/app/creation/create",
				},
				{
					title: "Contents",
					url: "/app/creation/contents",
				},
				{
					title: "Profiles",
					url: "/app/creation/profiles",
				},
				{
					title: "Personas",
					url: "/app/creation/personas",
				},
				{
					title: "Resources",
					url: "/app/creation/resources",
				},
			],
		},
		{
			title: "Contacts",
			url: "/app/contacts",
			icon: IconAddressBook,
			items: [
				{
					title: "List",
					url: "/app/contacts",
				},
				{
					title: "Engage",
					url: "/app/contacts/engage",
				},
			],
		},
		{
			title: "Projects",
			url: "/app/projects",
			icon: IconFolder,
			items: [
				{
					title: "List",
					url: "/app/projects",
				},
				{
					title: "Assistant",
					url: "/app/projects/assistant",
				},
			],
		},
	],
	navSecondary: [
		{
			title: "Settings",
			url: "/app/settings",
			icon: IconSettings,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { isLoaded, user } = useUser();
	if (!isLoaded || !user) return null;
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<Link to="/app">
								<IconInnerShadowTop className="!size-5" />
								<span className="text-base font-semibold">Resonance</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name: user.fullName || "",
						email: user.emailAddresses[0].emailAddress,
						avatar: user.imageUrl,
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}
