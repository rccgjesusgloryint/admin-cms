"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, FileText, Video, Calendar, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "user" | "blog" | "sermon" | "event";
  title: string;
  timestamp: Date;
}

interface Props {
  activities: Activity[];
}

const iconMap = {
  user: UserPlus,
  blog: FileText,
  sermon: Video,
  event: Calendar,
};

const colorMap = {
  user: "text-blue-500",
  blog: "text-green-500",
  sermon: "text-purple-500",
  event: "text-orange-500",
};

export function RecentActivity({ activities }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            activities.map((activity) => {
              const Icon = iconMap[activity.type];
              const colorClass = colorMap[activity.type];
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`rounded-full p-2 bg-muted ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
