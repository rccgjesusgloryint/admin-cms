"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sermon } from "@/lib/types";
import UpdateSermonForm from "@/components/sermons/UpdateSermonForm";

interface Props {
  sermon: Sermon;
}

export default function EditSermonWrapper({ sermon }: Props) {
  const router = useRouter();
  const [refresh, setRefresh] = useState(false);

  const handleClose = () => {
    router.push("/dashboard/sermons");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <UpdateSermonForm
        sermon={sermon}
        setRefresh={setRefresh}
        setClose={handleClose}
      />
    </div>
  );
}
