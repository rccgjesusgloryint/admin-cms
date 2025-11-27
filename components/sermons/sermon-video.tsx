"use client";

import { Card } from "@/components/ui/card";
import { getYoutubeVidId } from "@/lib/actions";

interface SermonVideoProps {
  videoUrl: string;
  title: string;
}

export function SermonVideo({ videoUrl, title }: SermonVideoProps) {
  const html = `<iframe
          src={"https://www.youtube.com/embed/"+${getYoutubeVidId(videoUrl)!!}}
          title="YouTube video player"
          allow="web-share;"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full absolute inset-0"
        /> `;
  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="relative aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${getYoutubeVidId(videoUrl)!!}`}
          title="YouTube video player"
          allow="web-share;"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full absolute inset-0"
        />
      </div>
    </Card>
  );
}
