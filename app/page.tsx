import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  ImageIcon, 
  FileText, 
  BarChart3,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: "Sermon Library",
      description: "Browse and manage uploaded sermons with transcripts and resources"
    },
    {
      icon: FileText,
      title: "Blog Publishing",
      description: "Create and publish blog posts to engage your congregation"
    },
    {
      icon: Calendar,
      title: "Event Management",
      description: "Schedule and track church events and activities"
    },
    {
      icon: ImageIcon,
      title: "Media Galleries",
      description: "Organize and share photos from church events"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Manage member roles and permissions"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track engagement and growth metrics"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32 sm:px-8 lg:px-12">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 dark:opacity-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-1/20 rounded-full blur-3xl opacity-20 dark:opacity-10" />
        
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 dark:bg-primary/20 px-4 py-2 mb-8 backdrop-blur-sm border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Church Management Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl mb-6">
              Jesus Glory
              <br />
              <span className="bg-gradient-to-r from-primary via-chart-1 to-primary bg-clip-text text-transparent">
                International Athy
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed">
              Streamline your church operations with our comprehensive admin platform. 
              Manage sermons, events, media, and engage your community—all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl hover:scale-105 w-full sm:w-auto"
              >
                Get Started
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-background/50 backdrop-blur-sm px-8 py-4 text-base font-medium text-foreground hover:bg-accent/80 transition-all w-full sm:w-auto"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-border/50">
              <div>
                <div className="text-3xl font-bold text-foreground">All-in-One</div>
                <div className="text-sm text-muted-foreground mt-1">Platform</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">Secure</div>
                <div className="text-sm text-muted-foreground mt-1">& Reliable</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">Modern</div>
                <div className="text-sm text-muted-foreground mt-1">Interface</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 sm:px-8 lg:px-12 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you manage and grow your church community
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 backdrop-blur-sm"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-chart-1/10 to-primary/10 p-12 backdrop-blur-sm border border-primary/20">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join us in modernizing church management. Access your admin dashboard and start making an impact today.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl hover:scale-105"
            >
              Access Dashboard
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-6 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Jesus Glory International Athy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
