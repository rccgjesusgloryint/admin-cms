"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sermon } from "@/lib/types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Heart, Lock, FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { SermonNotesPdf } from "../admin/components/SermonNotesPdf";

interface SermonActionsProps {
  sermon: Sermon;
}

export function SermonActions({ sermon }: SermonActionsProps) {
  const { data } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    data?.user ? true : false
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleResourceClick = () => {
    if (data?.user == undefined) {
      // toast({
      //   title: "Premium Feature",
      //   description: "Please log in as a member to access sermon resources.",
      //   variant: "default",
      // })
      // toast.error("Premium Feature, please sign in!");
      throw toast.error("Premium Feature, please sign in!");
    }

    if (sermon.sermonResources!.length === 0) {
      // toast({
      //   title: "No Resources Available",
      //   description: "This sermon doesn't have any resources yet.",
      //   variant: "default",
      // });
      throw toast.error("No Resources Available!");
    }

    setDialogOpen(true);
  };

  const handleDownloadResource = (resource: string, index: number) => {
    // Download logic handled by parent/backend
    // toast({
    //   title: "Downloading Resource",
    //   description: `Downloading resource ${index + 1}...`,
    // });
    toast("Downloading Resource...");
    // Add your download function here
    console.log("[v0] Downloading resource:", resource);
  };

  const hasResources =
    sermon.sermonResources && sermon.sermonResources.length > 0;

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex flex-wrap items-center gap-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              onClick={handleResourceClick}
              className="gap-2 bg-transparent"
            >
              <FileText className="h-5 w-5" />
              <span className="hidden sm:inline">Sermon Resources</span>
              {!isAuthenticated && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] bg-background">
            <DialogHeader>
              <DialogTitle>Sermon Resources</DialogTitle>
              <DialogDescription>
                Download available resources for this sermon
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              {hasResources ? (
                sermon.sermonResources!.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Resource {index + 1}
                        </p>
                        {/* <p className="text-xs text-muted-foreground truncate">
                          {resource}
                        </p> */}
                      </div>
                    </div>
                    {/* <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadResource(resource, index)}
                      className="shrink-0 ml-2"
                    > */}
                    <PDFDownloadLink
                      document={
                        <SermonNotesPdf title={""} articleHtml={resource} />
                      }
                      fileName={`${sermon.sermonTitle}-resource_file-${
                        index + 1
                      }.pdf`}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">
                        Download Resource {index + 1}
                      </span>
                    </PDFDownloadLink>
                    {/* </Button> */}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    No resources available for this sermon
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
