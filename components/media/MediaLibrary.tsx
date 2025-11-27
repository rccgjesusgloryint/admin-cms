"use client";

import type React from "react";

import { useState, useRef, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, X, ImageIcon, Calendar, FileText, MapPin } from "lucide-react"; // NEW
import { cn } from "@/lib/utils";
import { saveEventImages } from "@/lib/queries";
import Image from "next/image";

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

export function MediaLibrary() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState(""); // NEW
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    processFiles(droppedFiles);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      processFiles(selectedFiles);
    }
  };
  const processFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));
    setFiles((prev) => [...prev, ...uploadedFiles]);
  };
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) return alert("Please select at least one image");
    if (!eventDate || !eventTitle)
      return alert("Please fill in all required fields");

    setIsUploading(true);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f.file));
    formData.append("event", eventTitle);
    formData.append("date", eventDate);
    formData.append("description", eventDescription);
    formData.append("location", eventLocation); // NEW

    try {
      // 1) Ask server for presigned URLs
      const presignRes = await fetch("/api/upload/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((f) => ({ name: f.file.name, type: f.file.type })),
          prefix: `events/${eventTitle}`, // optional foldering
        }),
      });
      const { uploads } = await presignRes.json(); // [{ key, uploadUrl, publicUrl, contentType }]

      // 2) Upload each file directly to R2 (no size limit at your API)
      for (let i = 0; i < files.length; i++) {
        const f = files[i].file;
        const u = uploads[i];
        const put = await fetch(u.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": u.contentType },
          body: f,
        });
        if (!put.ok) throw new Error(`Upload failed: ${f.name}`);
      }

      // 3) Commit small metadata to your DB
      const imageUrls = uploads.map((u: any) => u.publicUrl);

      try {
        await saveEventImages({
          event: eventTitle,
          date: new Date(eventDate),
          location: eventLocation,
          description: eventDescription,
          images: imageUrls,
        });
      } catch (error) {
        throw error;
      }
      alert("Images uploaded successfully!");
      // Reset ONLY on success
      files.forEach((file) => URL.revokeObjectURL(file.preview));
      setFiles([]);
      setEventDate("");
      setEventTitle("");
      setEventDescription("");
      setEventLocation(""); // NEW
    } catch (err: any) {
      console.error("Network/Unexpected error:", err);
      alert(err?.message ?? "Unexpected error while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">
          Upload Event Photos
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Add photos from church events to share with the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Event Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="event-title"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="event-title"
                  type="text"
                  placeholder="e.g., Sunday Morning Worship"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* NEW: Location (optional) */}
            <div className="space-y-2">
              <Label
                htmlFor="event-location"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary" />
                Location{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="event-location"
                type="text"
                placeholder="e.g., St. Mark’s Church Hall"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Event Description</Label>
              <Textarea
                id="event-description"
                placeholder="Add a brief description of the event (optional)"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Photos <span className="text-destructive">*</span>
            </Label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Drop images here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, WebP (max 10MB per file)
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Grid */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Selected Images ({files.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="relative group aspect-square">
                      <Image
                        width={500}
                        height={500}
                        src={file.preview || "/placeholder.svg"}
                        alt={file.file.name}
                        className="w-full h-full object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                        aria-label={`Remove ${file.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {file.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                files.forEach((file) => URL.revokeObjectURL(file.preview));
                setFiles([]);
                setEventDate("");
                setEventTitle("");
                setEventDescription("");
                setEventLocation(""); // NEW
              }}
              disabled={isUploading}
            >
              Clear All
            </Button>
            <Button type="submit" disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
