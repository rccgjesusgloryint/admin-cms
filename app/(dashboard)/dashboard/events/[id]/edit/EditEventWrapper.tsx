"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventsType } from "@/lib/types";
import UpdateEventForm from "@/components/events/UpdateEventForm";

interface Props {
  event: EventsType;
}

export default function EditEventWrapper({ event }: Props) {
  const router = useRouter();
  const [refresh, setRefresh] = useState(false);

  const handleClose = () => {
    router.push("/dashboard/events");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <UpdateEventForm
        oldEvent={event}
        setRefresh={setRefresh}
        setClose={handleClose}
      />
    </div>
  );
}
