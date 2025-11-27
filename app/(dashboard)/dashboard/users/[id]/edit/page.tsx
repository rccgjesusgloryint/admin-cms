import { getUserById } from "@/lib/queries";
import EditUserWrapper from "./EditUserWrapper";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return <EditUserWrapper user={user} />;
}
