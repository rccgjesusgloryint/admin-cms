"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Media", href: "/dashboard/media", icon: Image },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Sermons", href: "/dashboard/sermons", icon: Video },
  { name: "Blogs", href: "/dashboard/blogs", icon: FileText },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Newsletter", href: "/dashboard/newsletter", icon: Mail },
  { name: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Admin Portal</h1>
      </div>
      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}