"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import UpdateUserForm from "@/components/users/forms/UpdateUserForm";

interface Props {
  user: User;
}

export default function EditUserWrapper({ user }: Props) {
  const router = useRouter();
  const [refresh, setRefresh] = useState(false);

  const handleClose = () => {
    router.push("/dashboard/users");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <UpdateUserForm
        user={user}
        setRefresh={setRefresh}
        setClose={handleClose}
      />
    </div>
  );
}
