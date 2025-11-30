"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";

export function Header({ user }: { user: any }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call custom logout API to clear cookies
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Welcome back, {user?.name}</h2>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isLoggingOut ? "Signing out..." : "Sign Out"}
      </Button>
    </header>
  );
}

import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Video, Users } from "lucide-react";

export default async function DashboardPage() {
  const [eventsCount, blogsCount, sermonsCount, usersCount] = await Promise.all(
    [
      prisma.events.count(),
      prisma.blog.count(),
      prisma.sermon.count(),
      prisma.user.count(),
    ]
  );

  const stats = [
    { name: "Total Events", value: eventsCount, icon: Calendar },
    { name: "Total Blogs", value: blogsCount, icon: FileText },
    { name: "Total Sermons", value: sermonsCount, icon: Video },
    { name: "Total Users", value: usersCount, icon: Users },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
