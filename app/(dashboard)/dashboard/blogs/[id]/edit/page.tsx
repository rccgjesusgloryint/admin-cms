import { getBlogWithId } from "@/lib/queries";
import EditBlogWrapper from "./EditBlogWrapper";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params;
  const blog = await getBlogWithId(id);

  if (!blog) {
    notFound();
  }

  return <EditBlogWrapper blog={blog} />;
}
