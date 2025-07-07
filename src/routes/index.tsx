import { IconInnerShadowTop, IconUpload, IconBrain, IconEdit, IconRocket, IconBolt, IconHeart, IconTarget } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="py-20 lg:py-32">
				<div className="container mx-auto px-4 text-center">
					<div className="flex items-center justify-center scale-200 mb-8">
						<IconInnerShadowTop className="!size-5" />
						<span className="text-xl font-semibold">Resonance</span>
					</div>
					
					<h1 className="text-4xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
						Stop Wrestling With Words.
						<br />Start Amplifying Your Voice.
					</h1>
					
					<p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
						An AI assistant <strong>removing friction</strong> for solopreneurs.
						<br />Finally, AI that captures YOUR authentic voice—not the "fast-paced world" robot-speak that screams ChatGPT.
					</p>
					
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
						<Button size="lg" className="text-lg px-8 py-6">
							<IconBolt className="h-5 w-5 mr-2" />
							Experience Your Voice
						</Button>
						<Button size="lg" variant="outline" className="text-lg px-8 py-6">
							Join Free Beta
						</Button>
					</div>
					
					<div className="text-base font-semibold text-muted-foreground">
						Beta starting soon.
					</div>
				</div>
			</section>

			{/* The Reality Section */}
			<section className="py-16 lg:py-24 bg-muted/20">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center">
						<h2 className="text-3xl lg:text-4xl font-bold mb-8">
							We see you. Wearing 10 hats by Tuesday.
						</h2>
						<p className="text-lg lg:text-xl text-muted-foreground mb-12">
							Brilliant ideas trapped because writing feels impossible. You have 30-60 minutes for content. Quality takes hours. The math doesn't work.
						</p>
						
						<div className="grid md:grid-cols-3 gap-8">
							<div className="text-center">
								<div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
									<IconTarget className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-semibold mb-2">Context-Switching Nightmare</h3>
								<p className="text-muted-foreground">CEO → Marketer → Writer → CEO. Your brain is fried, burning mental energy faster than you can brew coffee.</p>
							</div>
							
							<div className="text-center">
								<div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
									<IconHeart className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-semibold mb-2">Sounds Like Everyone Else</h3>
								<p className="text-muted-foreground">Generic. Canned. Like something a very polite, very uninspired robot spit out. Your audience can smell it from miles away.</p>
							</div>
							
							<div className="text-center">
								<div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
									<IconBolt className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-semibold mb-2">Time You Don't Have</h3>
								<p className="text-muted-foreground">Writing feels like pulling teeth, eating hours you simply don't have. Running harder on that hamster wheel for what?</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Before/After Demo */}
			<section className="py-16 lg:py-24">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
							The Generic AI Problem
						</h2>
						
						<div className="grid lg:grid-cols-2 gap-8 items-start">
							<div className="bg-muted/50 rounded-lg p-6 border h-full flex flex-col">
								<h3 className="text-lg font-semibold mb-4 text-muted-foreground">Generic AI Output</h3>
								<div className="bg-background rounded p-4 text-sm text-muted-foreground italic flex-1">
									"In today's fast-paced business environment, leveraging cutting-edge AI solutions has become essential for forward-thinking entrepreneurs seeking to optimize their content creation workflows and maximize ROI..."
								</div>
								<p className="text-sm text-muted-foreground mt-3">Robotic • Generic • Obvious AI</p>
							</div>
							
							<div className="bg-muted/30 rounded-lg p-6 border h-full flex flex-col">
								<h3 className="text-lg font-semibold mb-4">Your Voice with Resonance</h3>
								<div className="bg-background rounded p-4 text-sm flex-1">
									"Look, I get it. You're drowning in todo lists and somehow content creation landed on your plate again. But here's the thing most people won't tell you about AI tools..."
								</div>
								<p className="text-sm text-muted-foreground mt-3">Authentic • Personal • Genuinely Human</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-16 lg:py-24 bg-muted/20">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
							How Resonance Works
						</h2>
						
						<div className="divide-y divide-border rounded-lg border bg-background">
							<div className="px-6 py-6 hover:bg-muted/50 transition-colors">
								<div className="flex items-start gap-4">
									<IconUpload className="h-6 w-6 mt-1 text-primary" />
									<div>
										<h3 className="text-base font-medium mb-2">Upload Your Writing</h3>
										<p className="text-sm text-muted-foreground">Share your existing content, emails, or random thoughts. Anything that shows off your authentic voice.</p>
									</div>
								</div>
							</div>
							
							<div className="px-6 py-6 hover:bg-muted/50 transition-colors">
								<div className="flex items-start gap-4">
									<IconBrain className="h-6 w-6 mt-1 text-primary" />
									<div>
										<h3 className="text-base font-medium mb-2">We Learn Your Psychology</h3>
										<p className="text-sm text-muted-foreground">Resonance builds a deep psycho-stylistic map of your unique brain-wiring, quirky phrases, and how you frame ideas.</p>
									</div>
								</div>
							</div>
							
							<div className="px-6 py-6 hover:bg-muted/50 transition-colors">
								<div className="flex items-start gap-4">
									<IconEdit className="h-6 w-6 mt-1 text-primary" />
									<div>
										<h3 className="text-base font-medium mb-2">Create Effortlessly</h3>
										<p className="text-sm text-muted-foreground">Pick a topic, tell us who you're talking to (if you want), and watch authentic content flow in your voice.</p>
									</div>
								</div>
							</div>
							
							<div className="px-6 py-6 hover:bg-muted/50 transition-colors">
								<div className="flex items-start gap-4">
									<IconRocket className="h-6 w-6 mt-1 text-primary" />
									<div>
										<h3 className="text-base font-medium mb-2">Grow Together</h3>
										<p className="text-sm text-muted-foreground">Every piece of feedback makes it sharper, more profoundly you. It doesn't just generate—it grows with you.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Value Proposition */}
			<section className="py-16 lg:py-24">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center">
						<h2 className="text-3xl lg:text-4xl font-bold mb-8">
							<strong>Amplify</strong> your voice. <strong>Resonate</strong> with your audience, clients and prospects. <strong>Grow</strong> your business.
						</h2>
						
						<div className="divide-y divide-border rounded-lg border bg-background max-w-3xl mx-auto">
							<div className="px-6 py-6">
								<h3 className="text-lg font-medium mb-2">For Solopreneurs</h3>
								<p className="text-muted-foreground">You ARE the business. Every post, every email—it's your reputation on the line. Get hours back every week for what actually grows your business.</p>
							</div>
							
							<div className="px-6 py-6">
								<h3 className="text-lg font-medium mb-2">For Content Creators</h3>
								<p className="text-muted-foreground">Your audience connects with YOU. Scale without losing your soul. Quantity AND quality—you deserve both.</p>
							</div>
							
							<div className="px-6 py-6">
								<h3 className="text-lg font-medium mb-2">For Overwhelmed Founders</h3>
								<p className="text-muted-foreground">One tool that actually gets you. Simplify your stack, amplify your voice, reclaim your weekends.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Key Differentiators */}
			<section className="py-16 lg:py-24">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
							Why Resonance is Different
						</h2>
						
						<div className="divide-y divide-border rounded-lg border bg-background">
							<div className="px-6 py-6 hover:bg-muted/50 transition-colors">
								<div className="flex items-start gap-4">
									<IconBrain className="h-6 w-6 mt-1 text-primary" />
									<div>
										<h3 className="text-base font-medium mb-2">Learns Your Psychology, Not Just Words</h3>
										<p className="text-sm text-muted-foreground">This isn't just about mimicry. It goes deeper, understanding the psychology behind your words, how you structure arguments, where your conviction lies.</p>
									</div>
								</div>
							</div>
							
							<div className="px-6 py-6 hover:bg-muted/50 transition-colors">
								<div className="flex items-start gap-4">
									<IconHeart className="h-6 w-6 mt-1 text-primary" />
									<div>
										<h3 className="text-base font-medium mb-2">Human-Like, Genuinely</h3>
										<p className="text-sm text-muted-foreground">Statistically anomalous text with beautiful, messy imperfections. Varied sentence length, unpredictable words, conversational flow—because trust matters.</p>
									</div>
								</div>
							</div>
							
							<div className="px-6 py-6 hover:bg-muted/50 transition-colors">
								<div className="flex items-start gap-4">
									<IconTarget className="h-6 w-6 mt-1 text-primary" />
									<div>
										<h3 className="text-base font-medium mb-2">Built for Connection, Not Content Farms</h3>
										<p className="text-sm text-muted-foreground">Most AI gives you templates. We give you YOUR voice. No corporate boilerplate. No "fast-paced world" nonsense. Just authentic you.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section className="py-16 lg:py-24 bg-muted/20">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
							Early Beta Feedback
						</h2>
						
						<div className="divide-y divide-border rounded-lg border bg-background">
							<div className="px-6 py-6">
								<div className="flex items-start gap-4">
									<div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
										SM
									</div>
									<div>
										<p className="text-base mb-2">"Finally got my weekends back. Resonance writes like I actually think."</p>
										<p className="text-sm text-muted-foreground">Sarah M., Solo Consultant</p>
									</div>
								</div>
							</div>
							
							<div className="px-6 py-6">
								<div className="flex items-start gap-4">
									<div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
										MC
									</div>
									<div>
										<p className="text-base mb-2">"My audience can't tell the difference. It sounds exactly like my voice."</p>
										<p className="text-sm text-muted-foreground">Mike Chen, Content Creator</p>
									</div>
								</div>
							</div>
							
							<div className="px-6 py-6">
								<div className="flex items-start gap-4">
									<div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
										JK
									</div>
									<div>
										<p className="text-base mb-2">"Went from 3 hours per post to 15 minutes. Game changer."</p>
										<p className="text-sm text-muted-foreground">Jessica K., Marketing Founder</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="py-20 lg:py-32">
				<div className="container mx-auto px-4 text-center">
					<div className="max-w-3xl mx-auto">
						<h2 className="text-3xl lg:text-4xl font-bold mb-6">
							Ready to amplify your authentic voice?
						</h2>
						<p className="text-lg text-muted-foreground mb-8">
							Join our free beta and help shape the future of human-like AI.
							<br />Early access. Real impact. Your voice matters.
						</p>
						
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<Button size="lg" className="text-lg px-8 py-6">
								<IconRocket className="h-5 w-5 mr-2" />
								Start Your Beta Journey
							</Button>
							<Button size="lg" variant="outline" className="text-lg px-8 py-6">
								Learn More
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
