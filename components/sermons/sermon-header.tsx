import { Badge } from "@/components/ui/badge";
import { Sermon } from "@/lib/types";
import { Calendar, User } from "lucide-react";

interface SermonHeaderProps {
  sermon: Sermon;
}

export function SermonHeader({ sermon }: SermonHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">{sermon.speaker}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <time dateTime={sermon.createdAt!.toISOString()}>
            {sermon.createdAt!.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </div>

      <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl text-balance">
        {sermon.sermonTitle}
      </h1>

      <div className="flex flex-wrap gap-2">
        {sermon.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="rounded-full">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
