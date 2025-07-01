import { createFileRoute } from "@tanstack/react-router";
import { WriterCreationWizard } from "@/components/writer-creation-wizard";

export const Route = createFileRoute("/app/creation/writers/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container mx-auto py-6">
			<h1 className="text-3xl font-bold mb-6">Create New Writer</h1>
			<WriterCreationWizard />
		</div>
	);
}
