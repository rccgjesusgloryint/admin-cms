// src/components/ui/single-image-input.tsx
"use client";

import type React from "react";
import { useState, useRef, type DragEvent, useEffect } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface UploadedFile {
  file: File;
  preview: string;
}

interface SingleImageInputProps {
  /** The currently selected file (or null) */
  value: File | null;
  /** Function to call when the file is changed or removed */
  onChange: (file: File | null) => void;
  /** Optional classname for layout */
  className?: string;
}

export function SingleImageInput({
  value,
  onChange,
  className,
}: SingleImageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create or revoke the object URL for preview
  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    // `value` is a File object, create a preview
    const newPreview = URL.createObjectURL(value);
    setPreview(newPreview);

    // Cleanup function to revoke the object URL
    return () => URL.revokeObjectURL(newPreview);
  }, [value]); // Re-run when the 'value' prop changes

  // --- Drag and Drop Handlers ---
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
    const droppedFile = e.dataTransfer.files[0]; // Get only the first file
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      onChange(droppedFile); // Update parent state
    }
  };

  // --- File Select Handler ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith("image/")) {
        onChange(selectedFile); // Update parent state
      }
    }
    // Clear the input value to allow selecting the same file again
    if (e.target) e.target.value = "";
  };

  // --- Remove File Handler ---
  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from bubbling to the dropzone
    onChange(null); // Update parent state to null
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* STATE 1: File is Selected (Show Preview) */}
      {value && preview ? (
        <div className="relative group aspect-square w-full max-w-xs mx-auto">
          <Image
            src={preview}
            alt={value.name}
            width={500}
            height={500}
            className="w-full h-full object-cover rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={removeFile}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
            aria-label={`Remove ${value.name}`}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 rounded-b-lg truncate">
            {value.name}
          </div>
        </div>
      ) : (
        /* STATE 2: No File (Show Dropzone) */
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
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-4">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Drop an image here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: JPG, PNG, WebP
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
