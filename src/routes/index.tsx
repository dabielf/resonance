import { 
  IconInnerShadowTop, 
  IconArrowRight, 
  IconBolt, 
  IconUsers, 
  IconTarget, 
  IconBrain, 
  IconCheck, 
  IconStar, 
  IconSparkles, 
  IconMessageCircle, 
  IconClock, 
  IconTrendingUp
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")(({
	component: RouteComponent,
}));

function RouteComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
      {/* Header */}
      <header className="relative z-50 px-4 sm:px-6 py-4 sm:py-6 backdrop-blur-sm bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <IconInnerShadowTop className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-pulse" />
              <div className="absolute inset-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary/20 rounded-full blur-md animate-pulse"></div>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Resonance
            </span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium relative group">
              Reviews
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium relative group">
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>
          <Button className="bg-primary text-primary-foreground px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-sm sm:text-base">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-20 md:py-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <IconSparkles className="w-4 h-4 mr-2" />
              AI-Powered Voice Amplification
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
              Your Voice.
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Amplified.
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              Stop wrestling with words. Resonance learns your unique voice and creates content that sounds 
              authentically, undeniably <em>you</em>. Because your ideas deserve to be heard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-2">
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden group">
                <span className="relative z-10 flex items-center">
                  Start Writing Like You
                  <IconArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto text-muted-foreground hover:text-primary transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 border border-border hover:border-primary/50 rounded-lg group">
                <span className="flex items-center justify-center">
                  See How It Works
                  <div className="ml-2 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </span>
              </Button>
            </div>
            
            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto px-2">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">40%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Higher Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">80%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary">100%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Your Voice</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <IconClock className="w-4 h-4 mr-2" />
              The Reality Check
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">
              The Writing Wall We All Hit
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              You know this pain. Every creator, entrepreneur, and marketer faces the same brutal reality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start space-x-4">
                  <div className="bg-destructive/10 p-2 sm:p-3 rounded-lg group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                    <IconClock className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-base sm:text-lg">Time Vampire</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Hours disappear into the writing void. You have 30 minutes, maybe 60 if you're lucky. 
                      That's not enough time to craft the content your business needs.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start space-x-4">
                  <div className="bg-destructive/10 p-2 sm:p-3 rounded-lg group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                    <IconMessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-base sm:text-lg">Generic Robot Voice</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Everything sounds like it was written by a very polite, very uninspired algorithm. 
                      Your audience can smell the generic from miles away.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start space-x-4">
                  <div className="bg-destructive/10 p-2 sm:p-3 rounded-lg group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                    <IconBrain className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-base sm:text-lg">Mental Gymnastics</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      CEO mode. Marketing mode. Writer mode. Your brain is context-switching faster than 
                      you can brew coffee, burning through mental energy for what?
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start space-x-4">
                  <div className="bg-destructive/10 p-2 sm:p-3 rounded-lg group-hover:bg-destructive/20 transition-colors flex-shrink-0">
                    <IconTrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-base sm:text-lg">Scaling Nightmare</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Your ideas are brilliant. Your insights are game-changing. But turning them into 
                      consistent, compelling content? That's the bottleneck killing your growth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <IconBolt className="w-4 h-4 mr-2" />
              The Solution
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">
              How Resonance Changes Everything
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
              It's not just analyzing your words. It's learning your specific psychological rhythm, 
              your stylistic fingerprint, the unique wiring behind every sentence you write.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center group">
              <div className="relative mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <IconBrain className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all duration-300"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Deep Learning</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Upload your writing samples and watch Resonance build a psychological map of your unique voice. 
                Not just what you say, but how you think.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <IconBolt className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all duration-300"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Instant Creation</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Pick a topic, define your audience, and watch your authentic voice flow onto the page. 
                Professional-grade content in minutes, not hours.
              </p>
            </div>
            
            <div className="text-center group sm:col-span-2 md:col-span-1">
              <div className="relative mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <IconTrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all duration-300"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Continuous Evolution</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Every piece of feedback makes it sharper, more you. It doesn't just generate content—it grows 
                with you, becoming more nuanced over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <IconUsers className="w-4 h-4 mr-2" />
              Built for You
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">
              Built for Real Humans, Real Businesses
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Whether you're a solopreneur, content creator, or marketer, Resonance adapts to your unique needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:border-primary/30">
              <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <IconUsers className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">For Solopreneurs</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                You ARE the business. Every newsletter, social post, and web copy doesn't have to be another burden. 
                Free up time for what truly matters.
              </p>
              <div className="flex items-center text-xs sm:text-sm text-primary font-medium">
                <IconCheck className="w-4 h-4 mr-2" />
                Professional content in minutes
              </div>
            </div>
            
            <div className="bg-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:border-primary/30">
              <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <IconTarget className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">For Content Creators</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                Your audience connects with YOU. That specific, unique cadence. Scale your output without 
                diluting your personal touch.
              </p>
              <div className="flex items-center text-xs sm:text-sm text-primary font-medium">
                <IconCheck className="w-4 h-4 mr-2" />
                Quantity AND quality
              </div>
            </div>
            
            <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group hover:border-primary/30 md:col-span-2 lg:col-span-1">
              <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <IconMessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">For Marketers</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                Consistency and targeting are your bread and butter. Every email, ad, and post aligns with 
                your brand's core and speaks directly to your people.
              </p>
              <div className="flex items-center text-xs sm:text-sm text-primary font-medium">
                <IconCheck className="w-4 h-4 mr-2" />
                40% higher engagement
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="px-4 sm:px-6 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <IconStar className="w-4 h-4 mr-2 fill-current" />
              Social Proof
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">
              What People Are Saying
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Real results from real people who've transformed their content creation process.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed italic">
                "Finally, content that actually sounds like me. My engagement rates have never been higher, 
                and I'm spending 80% less time writing."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <span className="text-primary font-semibold text-sm sm:text-base">SK</span>
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Sarah Kim</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Marketing Consultant</div>
                </div>
              </div>
            </div>
            
            <div className="bg-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed italic">
                "I was skeptical about AI writing, but Resonance gets my voice in a way that's honestly spooky. 
                My newsletter subscribers can't tell the difference."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <span className="text-primary font-semibold text-sm sm:text-base">MR</span>
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Marcus Rodriguez</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Founder, TechStart</div>
                </div>
              </div>
            </div>
            
            <div className="bg-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group md:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <IconStar key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed italic">
                "Game changer. I went from dreading content creation to actually looking forward to it. 
                It's like having a writing partner who knows exactly how my brain works."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <span className="text-primary font-semibold text-sm sm:text-base">JL</span>
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Jessica Liu</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Content Creator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.2),transparent_70%)]"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <IconArrowRight className="w-4 h-4 mr-2" />
            Ready to Transform?
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">
            Ready to Sound Like You?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            Stop settling for generic content. Stop burning through hours you don't have. 
            Your voice is unique. Your content should be too.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-2">
            <Button className="w-full sm:w-auto bg-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center">
                Start Writing Like You
                <IconArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto text-muted-foreground hover:text-primary transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 border border-border hover:border-primary/50 rounded-lg">
              Watch Demo
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center text-xs sm:text-sm text-muted-foreground px-2">
            <div className="flex items-center">
              <IconCheck className="w-4 h-4 mr-2 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center">
              <IconCheck className="w-4 h-4 mr-2 text-primary" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <IconCheck className="w-4 h-4 mr-2 text-primary" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 sm:py-12 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="relative">
                <IconSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <div className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full blur-md"></div>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Resonance
              </span>
            </div>
            <div className="flex space-x-4 sm:space-x-6 text-muted-foreground text-sm sm:text-base">
              <a href="#" className="hover:text-primary transition-colors duration-300">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors duration-300">Terms</a>
              <a href="#" className="hover:text-primary transition-colors duration-300">Support</a>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border/50 text-center text-muted-foreground text-xs sm:text-sm">
            <p>&copy; 2025 Resonance. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}