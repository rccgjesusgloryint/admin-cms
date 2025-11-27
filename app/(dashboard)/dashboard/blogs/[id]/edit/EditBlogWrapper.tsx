"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlogType } from "@/lib/types";
import UpdateBlogForm from "@/components/blogs/UpdateBlogForm";

interface Props {
  blog: BlogType;
}

export default function EditBlogWrapper({ blog }: Props) {
  const router = useRouter();
  const [refresh, setRefresh] = useState(false);

  const handleClose = () => {
    router.push("/dashboard/blogs");
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <UpdateBlogForm
        blog={blog}
        setRefresh={setRefresh}
        setClose={handleClose}
      />
    </div>
  );
}
