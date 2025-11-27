"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { getAllSermons, deleteSermon } from "@/lib/queries";

export function SermonsList() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSermons();
  }, []);

  async function fetchSermons() {
    try {
      const res = await getAllSermons()
      setSermons(res);
    } catch (error) {
      console.error("Error fetching sermons:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this sermon?")) return;
    
    try {
      await deleteSermon(id);
      setSermons(sermons.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error deleting sermon:", error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {sermons.map((sermon) => (
        <Card key={sermon.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{sermon.sermonTitle}</span>
              <div className="flex gap-2">
                <Link href={`/dashboard/sermons/${sermon.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(sermon.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Speaker: {sermon.speaker || "Unknown"}
            </p>
            <p className="text-sm text-muted-foreground">
              Tags: {sermon.tags?.join(", ") || "None"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}