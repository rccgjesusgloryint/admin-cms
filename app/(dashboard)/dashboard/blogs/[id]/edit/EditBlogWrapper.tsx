"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { BlogType } from "@/lib/types";
import dynamic from "next/dynamic";
import UpdateBlogForm from "@/components/blogs/UpdateBlogForm";

// Dynamically import the form with no SSR to prevent findDOMNode errors
// const UpdateBlogForm = dynamic(
//   () => import("@/components/blogs/UpdateBlogForm"),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="max-w-4xl mx-auto">
//         <div className="flex items-center justify-center min-h-[500px]">
//           <p className="text-muted-foreground">Loading editor...</p>
//         </div>
//       </div>
//     )
//   }
// );

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
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[500px]">
            <p className="text-muted-foreground">Loading editor...</p>
          </div>
        }
      >
        <UpdateBlogForm
          blog={blog}
          setRefresh={setRefresh}
          setClose={handleClose}
        />
      </Suspense>
    </div>
  );
}
