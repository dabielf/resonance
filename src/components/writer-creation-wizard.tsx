import {
	IconArrowLeft,
	IconArrowRight,
	IconBrain,
	IconCheck,
	IconFileText,
	IconUser,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/router";

type Step = "basic" | "content" | "review" | "processing";
type ProcessingStage =
	| "creating"
	| "uploading"
	| "psychology"
	| "writing"
	| "complete";

const steps = [
	{ id: "basic", title: "Basic Info", icon: IconUser },
	{ id: "content", title: "Writing Samples", icon: IconFileText },
	{ id: "review", title: "Review", icon: IconCheck },
	{ id: "processing", title: "Processing", icon: IconBrain },
];

export function WriterCreationWizard() {
	const navigate = useNavigate();
	const nameId = useId();
	const descriptionId = useId();
	const samplesId = useId();
	const [currentStep, setCurrentStep] = useState<Step>("basic");
	const [processingStage, setProcessingStage] =
		useState<ProcessingStage>("creating");
	const [ghostwriterId, setGhostwriterId] = useState<number | null>(null);
	const queryClient = useQueryClient();

	// Form data
	const [ghostwriterName, setGhostwriterName] = useState("");
	const [ghostwriterDescription, setGhostwriterDescription] = useState("");
	const [contentSamples, setContentSamples] = useState("");

	// TRPC mutations
	const createGhostwriterMutation = useMutation(
		trpc.contentRouter.createGhostwriter.mutationOptions({
			onSuccess: async (data) => {
				console.log("Ghostwriter created successfully:", data);
				setGhostwriterId(data.id);
				setProcessingStage("uploading");
				// Start uploading content
				await addOriginalContentMutation.mutateAsync({
					gwId: data.id,
					content: contentSamples.trim(),
				});
			},
			onError: (error) => {
				console.error("Failed to create ghostwriter:", error);
				toast.error("Failed to create ghostwriter. Please try again.");
				setCurrentStep("review");
			},
		}),
	);

	const addOriginalContentMutation = useMutation(
		trpc.contentRouter.addOriginalContents.mutationOptions({
			onSuccess: async (data) => {
				console.log("Original content added successfully:", data);
				if (ghostwriterId) {
					setProcessingStage("psychology");
					// Start creating psychology profile
					await createPsyProfileMutation.mutateAsync({
						gwId: ghostwriterId,
						name: `${ghostwriterName} - Psychology Profile`,
					});
				}
			},
			onError: (error) => {
				console.error("Failed to add original content:", error);
				toast.error("Failed to add original content. Please try again.");
			},
		}),
	);

	const createPsyProfileMutation = useMutation(
		trpc.contentRouter.createPsyProfile.mutationOptions({
			onSuccess: async (data) => {
				console.log("Psychology profile created successfully:", data);
				if (ghostwriterId) {
					setProcessingStage("writing");
					// Start creating writing profile
					await createWritingProfileMutation.mutateAsync({
						gwId: ghostwriterId,
						name: `${ghostwriterName} - Writing Profile`,
					});
				}
			},
			onError: (error) => {
				console.error("Failed to create psychology profile:", error);
				toast.error(
					"Failed to create psychology profile. You can retry later from the writer's page.",
				);
			},
		}),
	);

	const createWritingProfileMutation = useMutation(
		trpc.contentRouter.createWritingProfile.mutationOptions({
			onSuccess: async (data) => {
				console.log("Writing profile created successfully:", data);
				setProcessingStage("complete");
				toast.success("Writer created successfully with all profiles!");
				queryClient.invalidateQueries({
					queryKey: trpc.contentRouter.listGhostwriters.queryKey(),
				});
				setTimeout(() => {
					navigate({ to: "/app/creation/writers" });
				}, 1500);
			},
			onError: (error) => {
				console.error("Failed to create writing profile:", error);
				toast.error(
					"Failed to create writing profile. You can retry later from the writer's page.",
				);
			},
		}),
	);

	const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
	const progress = ((currentStepIndex + 1) / steps.length) * 100;

	// Helper function to count samples
	const countSamples = () => {
		if (!contentSamples.trim()) return 0;
		return contentSamples.split("===").filter((sample) => sample.trim()).length;
	};

	const canProceedFromBasic = ghostwriterName.trim().length >= 2;
	const canProceedFromContent = countSamples() >= 10;
	const canCreate = canProceedFromBasic && canProceedFromContent;

	const goToNextStep = () => {
		switch (currentStep) {
			case "basic":
				if (!canProceedFromBasic) {
					toast.error("Please provide a name for your writer");
					return;
				}
				setCurrentStep("content");
				break;
			case "content":
				if (!canProceedFromContent) {
					toast.error("Please add at least 10 content samples");
					return;
				}
				setCurrentStep("review");
				break;
			case "review":
				if (!canCreate) {
					toast.error("Please complete all required fields");
					return;
				}
				createWriter();
				break;
		}
	};

	const goToPreviousStep = () => {
		switch (currentStep) {
			case "content":
				setCurrentStep("basic");
				break;
			case "review":
				setCurrentStep("content");
				break;
			case "processing":
				setCurrentStep("review");
				break;
		}
	};

	const createWriter = async () => {
		setCurrentStep("processing");
		setProcessingStage("creating");

		try {
			console.log("Starting writer creation...");
			await createGhostwriterMutation.mutateAsync({
				name: ghostwriterName,
				description: ghostwriterDescription || undefined,
			});
		} catch (error) {
			console.error("Error in createWriter:", error);
		}
	};

	return (
		<div className="space-y-6">
			{/* Progress Bar */}
			<div className="space-y-2">
				<div className="flex justify-between text-sm text-muted-foreground">
					<span>
						Step {currentStepIndex + 1} of {steps.length}
					</span>
					<span>{Math.round(progress)}% complete</span>
				</div>
				<Progress value={progress} className="h-2" />
			</div>

			{/* Step Indicators */}
			<div className="flex justify-center">
				<div className="flex items-center space-x-4">
					{steps.map((step, index) => {
						const isActive = step.id === currentStep;
						const isCompleted = index < currentStepIndex;
						const isAccessible = index <= currentStepIndex;

						return (
							<div key={step.id} className="flex items-center">
								<motion.div
									className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${isActive ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${isCompleted ? "border-green-500 bg-green-500 text-white" : ""}
                    ${!isActive && !isCompleted ? "border-muted-foreground/30 text-muted-foreground" : ""}
                  `}
									whileHover={isAccessible ? { scale: 1.05 } : {}}
									whileTap={isAccessible ? { scale: 0.95 } : {}}
								>
									{isCompleted ? (
										<IconCheck className="h-5 w-5" />
									) : (
										<step.icon className="h-5 w-5" />
									)}
								</motion.div>

								<div className="ml-2 hidden sm:block">
									<p
										className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}
									>
										{step.title}
									</p>
								</div>

								{index < steps.length - 1 && (
									<div className="w-16 h-px bg-muted-foreground/30 mx-4" />
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Step Content */}
			<Card className="max-w-2xl mx-auto">
				<AnimatePresence mode="wait">
					{currentStep === "basic" && (
						<motion.div
							key="basic"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<IconUser className="h-5 w-5" />
									Basic Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor={nameId}>Writer Name</Label>
									<Input
										id={nameId}
										placeholder="e.g., My Blog Writer, LinkedIn Assistant, Technical Writer"
										value={ghostwriterName}
										onChange={(e) => setGhostwriterName(e.target.value)}
										className="text-base"
									/>
									<p className="text-sm text-muted-foreground">
										Give your AI writer a descriptive name to help you identify
										its purpose.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor={descriptionId}>Description (Optional)</Label>
									<Textarea
										id={descriptionId}
										placeholder="e.g., Professional content writer for tech blog posts and tutorials"
										value={ghostwriterDescription}
										onChange={(e) => setGhostwriterDescription(e.target.value)}
										className="min-h-[80px] resize-none"
									/>
									<p className="text-sm text-muted-foreground">
										Add a brief description to remember what this writer is for.
									</p>
								</div>
							</CardContent>
						</motion.div>
					)}

					{currentStep === "content" && (
						<motion.div
							key="content"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<IconFileText className="h-5 w-5" />
									Writing Samples
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm text-muted-foreground">
									Provide 10-20 examples of your writing for best results. The
									AI will analyze these to learn your unique voice, style, and
									personality. More diverse samples lead to better writing
									quality.
								</p>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor={samplesId}>Your Writing Samples</Label>
										<Badge
											variant={countSamples() >= 10 ? "default" : "outline"}
											className="text-xs"
										>
											{countSamples()} samples
										</Badge>
									</div>
									<Textarea
										id={samplesId}
										placeholder={`Paste your first writing sample here...

===

Paste your second writing sample here...

===

Paste your third writing sample here...

===

Continue adding more samples...`}
										className="h-[400px] font-mono text-sm resize-none"
										value={contentSamples}
										onChange={(e) => setContentSamples(e.target.value)}
									/>
									<p className="text-xs text-muted-foreground text-right">
										Separate each sample with "==="
									</p>
								</div>

								<div className="space-y-3">
									<div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
										<h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
											How to format your samples:
										</h4>
										<ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
											<li>
												• Paste 10-20 different writing samples for best results
											</li>
											<li>
												• Separate each sample with three equals signs: ===
											</li>
											<li>
												• Include diverse content (emails, blog posts, reports,
												messages, etc.)
											</li>
											<li>
												• Quality matters more than length - even short samples
												work
											</li>
										</ul>
									</div>

									{countSamples() > 0 && countSamples() < 10 && (
										<div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
											<p className="text-sm text-amber-800 dark:text-amber-200">
												<strong>Recommendation:</strong> Add at least 10 samples
												for optimal results. Currently detected:{" "}
												{countSamples()} sample{countSamples() !== 1 ? "s" : ""}
												. Need {10 - countSamples()} more.
											</p>
										</div>
									)}

									{countSamples() >= 10 && (
										<div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
											<p className="text-sm text-green-800 dark:text-green-200">
												<strong>Great!</strong> You have {countSamples()}{" "}
												samples.
												{countSamples() < 20
													? ` Adding ${20 - countSamples()} more samples will improve quality even further.`
													: " This is an excellent amount for training."}
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</motion.div>
					)}

					{currentStep === "review" && (
						<motion.div
							key="review"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<IconCheck className="h-5 w-5" />
									Review & Create
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<p className="text-sm text-muted-foreground">
									Review your writer details before creation. The AI will
									analyze your samples to create psychology and writing
									profiles.
								</p>

								<div className="space-y-4">
									<div>
										<Label className="text-sm font-medium">Name</Label>
										<p className="text-base mt-1">{ghostwriterName}</p>
									</div>

									{ghostwriterDescription && (
										<div>
											<Label className="text-sm font-medium">Description</Label>
											<p className="text-base mt-1">{ghostwriterDescription}</p>
										</div>
									)}

									<div>
										<Label className="text-sm font-medium">
											Content Samples
										</Label>
										<div className="mt-2 space-y-2">
											<div className="p-3 border rounded bg-muted/30">
												<div className="flex items-center justify-between">
													<span className="text-sm">Number of samples</span>
													<Badge variant="outline" className="text-xs">
														{countSamples()} samples
													</Badge>
												</div>
											</div>
											<div className="p-2 bg-muted/20 rounded max-h-32 overflow-auto">
												<pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
													{contentSamples.substring(0, 200)}...
												</pre>
											</div>
										</div>
									</div>
								</div>

								<div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
									<h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
										What happens next?
									</h4>
									<ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
										<li>• AI analyzes your writing patterns and psychology</li>
										<li>• Creates a unique psychology profile</li>
										<li>• Generates a personalized writing style profile</li>
										<li>• Your writer will be ready to generate content!</li>
									</ul>
								</div>
							</CardContent>
						</motion.div>
					)}

					{currentStep === "processing" && (
						<motion.div
							key="processing"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}
						>
							<CardContent className="py-12 text-center space-y-6">
								<motion.div
									animate={{ rotate: processingStage === "complete" ? 0 : 360 }}
									transition={{
										duration: 2,
										repeat: processingStage === "complete" ? 0 : Infinity,
										ease: "linear",
									}}
								>
									{processingStage === "complete" ? (
										<IconCheck className="h-16 w-16 text-green-500 mx-auto" />
									) : (
										<IconBrain className="h-16 w-16 text-primary mx-auto" />
									)}
								</motion.div>

								<div className="space-y-2">
									<h3 className="text-xl font-semibold">
										{processingStage === "complete"
											? "Writer Created!"
											: "Creating Your Writer"}
									</h3>
									<p className="text-muted-foreground">
										{processingStage === "complete"
											? "All profiles have been successfully generated."
											: "Our AI is analyzing your writing samples and creating personalized profiles..."}
									</p>
								</div>

								<div className="space-y-3 max-w-sm mx-auto text-left">
									{/* Creating writer */}
									<div className="flex items-center gap-3">
										{processingStage === "creating" ? (
											<motion.div
												animate={{ scale: [1, 1.2, 1] }}
												transition={{ duration: 1, repeat: Infinity }}
												className="h-2 w-2 bg-primary rounded-full flex-shrink-0"
											/>
										) : (
											<IconCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
										)}
										<span
											className={`text-sm ${processingStage !== "creating" ? "text-muted-foreground" : ""}`}
										>
											Creating writer profile
										</span>
									</div>

									{/* Uploading content */}
									<div className="flex items-center gap-3">
										{processingStage === "uploading" ? (
											<motion.div
												animate={{ scale: [1, 1.2, 1] }}
												transition={{ duration: 1, repeat: Infinity }}
												className="h-2 w-2 bg-primary rounded-full flex-shrink-0"
											/>
										) : processingStage === "creating" ? (
											<div className="h-2 w-2 bg-gray-300 rounded-full flex-shrink-0" />
										) : (
											<IconCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
										)}
										<span
											className={`text-sm ${
												processingStage === "creating"
													? "text-muted-foreground/50"
													: processingStage !== "uploading"
														? "text-muted-foreground"
														: ""
											}`}
										>
											Uploading writing samples
										</span>
									</div>

									{/* Psychology profile */}
									<div className="flex items-center gap-3">
										{processingStage === "psychology" ? (
											<motion.div
												animate={{ scale: [1, 1.2, 1] }}
												transition={{ duration: 1, repeat: Infinity }}
												className="h-2 w-2 bg-primary rounded-full flex-shrink-0"
											/>
										) : ["creating", "uploading"].includes(processingStage) ? (
											<div className="h-2 w-2 bg-gray-300 rounded-full flex-shrink-0" />
										) : (
											<IconCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
										)}
										<span
											className={`text-sm ${
												["creating", "uploading"].includes(processingStage)
													? "text-muted-foreground/50"
													: processingStage !== "psychology"
														? "text-muted-foreground"
														: ""
											}`}
										>
											Analyzing psychological patterns
										</span>
									</div>

									{/* Writing profile */}
									<div className="flex items-center gap-3">
										{processingStage === "writing" ? (
											<motion.div
												animate={{ scale: [1, 1.2, 1] }}
												transition={{ duration: 1, repeat: Infinity }}
												className="h-2 w-2 bg-primary rounded-full flex-shrink-0"
											/>
										) : processingStage === "complete" ? (
											<IconCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
										) : (
											<div className="h-2 w-2 bg-gray-300 rounded-full flex-shrink-0" />
										)}
										<span
											className={`text-sm ${
												["creating", "uploading", "psychology"].includes(
													processingStage,
												)
													? "text-muted-foreground/50"
													: processingStage !== "writing"
														? "text-muted-foreground"
														: ""
											}`}
										>
											Analyzing writing style
										</span>
									</div>
								</div>

								{processingStage === "complete" && (
									<motion.p
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.5 }}
										className="text-sm text-muted-foreground"
									>
										Redirecting to writers page...
									</motion.p>
								)}
							</CardContent>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Navigation */}
				{currentStep !== "processing" && (
					<div className="flex justify-between p-6 border-t">
						<Button
							variant="outline"
							onClick={goToPreviousStep}
							disabled={currentStep === "basic"}
						>
							<IconArrowLeft className="h-4 w-4 mr-2" />
							Previous
						</Button>

						<Button
							onClick={goToNextStep}
							disabled={
								(currentStep === "basic" && !canProceedFromBasic) ||
								(currentStep === "content" && !canProceedFromContent)
							}
						>
							{currentStep === "review" ? (
								"Create Writer"
							) : (
								<>
									Next
									<IconArrowRight className="h-4 w-4 ml-2" />
								</>
							)}
						</Button>
					</div>
				)}
			</Card>
		</div>
	);
}
