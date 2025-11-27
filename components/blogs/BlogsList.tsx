"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { getAllBlogs, deleteBlog } from "@/lib/queries";

export function BlogsList() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    try {
      const res = await getAllBlogs();
      setBlogs(res);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    try {
      await deleteBlog(id);
      setBlogs(blogs.filter(b => b.id !== id));
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {blogs.map((blog) => (
        <Card key={blog.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{blog.blogTitle}</span>
              <div className="flex gap-2">
                <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(blog.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {blog.blogDescription}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Category: {blog.category}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}