"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FeedbackList() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  async function fetchFeedback() {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFeedback(data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {feedback.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{item.name || "Anonymous"}</span>
              <Badge>{item.category || "General"}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">{item.message}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              {item.email && <span>Email: {item.email}</span>}
              {item.feedbackFrom && <span>From: {item.feedbackFrom}</span>}
              <span>
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}