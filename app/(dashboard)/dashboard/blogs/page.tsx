import { BlogsList } from "@/components/blogs/BlogsList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
export default function BlogsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blogs</h1>
        <Link href="/dashboard/blogs/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Blog
          </Button>
        </Link>
      </div>
      <BlogsList />
    </div>
  );
}