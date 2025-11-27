import React from "react";
import { GalleryUploadForm } from "./gallery-upload-form";

type Props = {};

const MultipleFileUpload = ({}: Props) => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground text-balance">
            Share Your Photos
          </h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Help document our church community by uploading photos from recent
            events
          </p>
        </div>

        <GalleryUploadForm />
      </div>
    </div>
  );
};

export default MultipleFileUpload;
