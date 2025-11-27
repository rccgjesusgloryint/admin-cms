import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Video, Users, TrendingUp } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { getRecentActivity, getSystemStatus, getNewUsersLast24Hours } from "@/lib/queries";

export default async function DashboardPage() {
  const session = await auth();

  // Fetch counts for the dashboard stats in parallel
  const [eventsCount, blogsCount, sermonsCount, usersCount, recentActivity, systemStatus, newUsers24h] = await Promise.all([
    prisma.events.count(),
    prisma.blog.count(),
    prisma.sermon.count(),
    prisma.user.count(),
    getRecentActivity(),
    getSystemStatus(),
    getNewUsersLast24Hours(),
  ]);

  const stats = [
    {
      name: "Total Events",
      value: eventsCount,
      icon: Calendar,
      description: "Upcoming and past events"
    },
    {
      name: "Total Blogs",
      value: blogsCount,
      icon: FileText,
      description: "Published blog posts"
    },
    {
      name: "Total Sermons",
      value: sermonsCount,
      icon: Video,
      description: "Sermons in library"
    },
    {
      name: "Total Users",
      value: usersCount,
      icon: Users,
      description: "Registered members"
    },
    {
      name: "New Users (24h)",
      value: newUsers24h,
      icon: TrendingUp,
      description: "Registered in last 24 hours"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || "Admin"}. Here's an overview of your content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivity} />
        <SystemStatus systemStatus={systemStatus} />
      </div>
    </div>
  );
}