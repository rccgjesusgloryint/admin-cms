import { getEventById } from "@/lib/queries";
import EditEventWrapper from "./EditEventWrapper";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(parseInt(id));

  if (!event) {
    notFound();
  }

  return <EditEventWrapper event={event} />;
}
