"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Image,
  Calendar,
  Video,
  FileText,
  Users,
  Mail,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react";
import { markSectionSeen, NotificationCounts } from "@/lib/queries";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: null,
  },
  { name: "Media", href: "/dashboard/media", icon: Image, section: null },
  { name: "Events", href: "/dashboard/events", icon: Calendar, section: null },
  { name: "Sermons", href: "/dashboard/sermons", icon: Video, section: null },
  { name: "Blogs", href: "/dashboard/blogs", icon: FileText, section: null },
  { name: "Users", href: "/dashboard/users", icon: Users, section: "users" },
  {
    name: "Newsletter",
    href: "/dashboard/newsletter",
    icon: Mail,
    section: null,
  },
  {
    name: "Feedback",
    href: "/dashboard/feedback",
    icon: MessageSquare,
    section: "feedback",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    section: null,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    section: null,
  },
];

interface SidebarProps {
  notificationCounts?: NotificationCounts;
  userId?: string;
}

export function Sidebar({ notificationCounts, userId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state to track which sections have been marked as seen this session
  const [seenSections, setSeenSections] = useState<Set<string>>(new Set());

  // Mark section as seen when navigating to it
  useEffect(() => {
    if (!userId) return;

    const currentNav = navigation.find((item) => pathname === item.href);
    if (currentNav?.section && !seenSections.has(currentNav.section)) {
      // Mark as seen locally (immediate UI update)
      setSeenSections((prev) => new Set(prev).add(currentNav.section!));

      // Persist to database
      markSectionSeen(userId, currentNav.section).then(() => {
        // Refresh server data in background
        startTransition(() => {
          router.refresh();
        });
      });
    }
  }, [pathname, userId, seenSections, router]);

  const getNotificationCount = (section: string | null): number => {
    if (!section || !notificationCounts) return 0;
    // If section was marked as seen this session, show 0
    if (seenSections.has(section)) return 0;
    return notificationCounts[section as keyof NotificationCounts] || 0;
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
      </div>
      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const count = getNotificationCount(item.section);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                {item.name}
              </div>
              {count > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full animate-pulse">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
