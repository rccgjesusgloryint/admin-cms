import MediaPage from "@/components/media";
import { MediaLibrary } from "@/components/media/MediaLibrary";

export default function MediaPageRoot() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage your website images and files.
          </p>
        </div>
      </div>
      <MediaLibrary />
    </div>
  );
}