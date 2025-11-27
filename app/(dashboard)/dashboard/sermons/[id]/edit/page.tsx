import { getSermonById } from "@/lib/queries";
import EditSermonWrapper from "./EditSermonWrapper";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSermonPage({ params }: Props) {
  const { id } = await params;
  const sermon = await getSermonById(parseInt(id));

  if (!sermon) {
    notFound();
  }

  return <EditSermonWrapper sermon={sermon} />;
}
