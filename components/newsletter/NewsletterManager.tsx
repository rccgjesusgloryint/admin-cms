"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { getAllNewsletterEmails } from "@/lib/queries";

export function NewsletterManager() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [emailData, setEmailData] = useState({
    subject: "",
    content: "",
  });

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    try {
      const res = await getAllNewsletterEmails();
      setSubscribers(res);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendNewsletter(e: React.FormEvent) {
    e.preventDefault();
    
    if (!emailData.subject || !emailData.content) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!confirm(`Send newsletter to ${subscribers.length} subscribers?`)) {
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      if (res.ok) {
        toast.success("Newsletter sent successfully!");
        setEmailData({ subject: "", content: "" });
      } else {
        toast.error("Failed to send newsletter");
      }
    } catch (error) {
      console.error("Error sending newsletter:", error);
      toast.error("Error sending newsletter");
    } finally {
      setSending(false);
    }
  }

  async function handleExportSubscribers() {
    const csv = ["Email"].concat(subscribers.map(s => s.email)).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  return (
    <Tabs defaultValue="compose" className="w-full">
      <TabsList>
        <TabsTrigger value="compose">Compose</TabsTrigger>
        <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
      </TabsList>

      <TabsContent value="compose">
        <Card>
          <CardHeader>
            <CardTitle>Send Newsletter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNewsletter} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="Newsletter subject..."
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={emailData.content}
                  onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                  placeholder="Newsletter content..."
                  rows={10}
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Will be sent to {subscribers.length} subscribers
                </p>
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Send Newsletter"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subscribers">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Subscribers ({subscribers.length})</span>
              <Button onClick={handleExportSubscribers} variant="outline">
                Export CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading subscribers...</p>
            ) : (
              <div className="space-y-2">
                {subscribers.map((subscriber, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg text-sm"
                  >
                    {subscriber.email}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}