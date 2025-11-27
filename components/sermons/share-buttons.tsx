"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Facebook, Twitter, Link2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";

interface ShareButtonsProps {
  title: string;
  url: string;
  heading?: string; // Optional custom heading text
}

export function ShareButtons({ 
  title, 
  url, 
  heading = "Share this" 
}: ShareButtonsProps) {
  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `whatsapp://send?text=${encodedTitle}: ${encodedUrl}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          "_blank"
        );
        break;
      case "email":
        window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedTitle}: ${encodedUrl}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard", {});
        // toast(message: {
        //   title: "Link copied",
        //   description: "Sermon link copied to clipboard",
        // });
        break;
    }
  };

  return (
    <Card className="p-6 border-border bg-card">
      <h3 className="font-semibold text-foreground mb-4">{heading}</h3>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("facebook")}
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("whatsapp")}
          aria-label="Share on Facebook"
        >
          <FaWhatsapp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("twitter")}
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("email")}
          aria-label="Share via Email"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare("copy")}
          aria-label="Copy link"
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
