"use client";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import React, { FormEvent, FormEventHandler, useEffect, useState } from "react";
import { SingleImageInput } from "./single-image-upload";

type Props = {
  onChange: (file: File | null) => void;
  value: File | null;
  label?: string;
};

const FileUpload = ({ onChange, value, label }: Props) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="post-image">
        {label ? label : "Cover Image"}{" "}
        <span className="text-destructive">*</span>
      </Label>
      <SingleImageInput value={value} onChange={onChange} />
    </div>
  );
};

export default FileUpload;
