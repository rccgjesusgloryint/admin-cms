"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { getAllEvents, deleteEvent } from "@/lib/queries";

export function EventsList() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await getAllEvents()
      setEvents(res);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{event.event}</span>
              <div className="flex gap-2">
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Location: {event.location}
            </p>
            <p className="text-sm text-muted-foreground">
              Date: {event.monthly || (!event.date?.[0] && !event.date?.[1]) ? "Monthly" : `${event.date?.[0]} - ${event.date?.[1]}`}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}