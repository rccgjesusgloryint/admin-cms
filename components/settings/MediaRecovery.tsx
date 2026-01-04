"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ImageIcon, RefreshCw, Check, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { saveEventImages, getAllEventMediaForRecovery } from "@/lib/queries";
import type { R2ObjectInfo } from "@/lib/types";

interface EventOption {
  id: number;
  event: string;
  date: Date;
}

export function MediaRecovery() {
  const [objects, setObjects] = useState<R2ObjectInfo[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [assignedUrls, setAssignedUrls] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | null>(
    null
  );
  const [hasMore, setHasMore] = useState(true);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventData = await getAllEventMediaForRecovery();
        setEvents(eventData);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, []);

  // Fetch R2 objects
  const fetchObjects = useCallback(
    async (token?: string) => {
      if (isLoading) return;
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ maxKeys: "50" });
        if (token) params.set("continuationToken", token);

        const response = await fetch(`/api/r2/list?${params}`);
        if (!response.ok) throw new Error("Failed to fetch R2 objects");

        const data = await response.json();

        setObjects((prev) => {
          // Filter out already assigned URLs and deduplicate
          const existingKeys = new Set(prev.map((o) => o.key));
          const newObjects = data.objects.filter(
            (o: R2ObjectInfo) =>
              !existingKeys.has(o.key) && !assignedUrls.has(o.url)
          );
          return [...prev, ...newObjects];
        });
        setContinuationToken(data.continuationToken ?? null);
        setHasMore(data.isTruncated);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load images from R2");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, assignedUrls]
  );

  // Initial load
  useEffect(() => {
    fetchObjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchObjects(continuationToken ?? undefined);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [continuationToken, hasMore, isLoading, fetchObjects]);

  // Toggle selection
  const toggleSelection = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  // Select all visible
  const selectAll = () => {
    const allVisibleUrls = objects
      .filter((o) => !assignedUrls.has(o.url))
      .map((o) => o.url);
    setSelectedUrls(new Set(allVisibleUrls));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedUrls(new Set());
  };

  // Assign selected images to event
  const handleAssign = async () => {
    if (selectedUrls.size === 0) {
      toast.error("Please select at least one image");
      return;
    }

    const eventName = isNewEvent ? newEventName.trim() : selectedEvent;
    if (!eventName) {
      toast.error("Please select or enter an event name");
      return;
    }

    if (isNewEvent && !newEventDate) {
      toast.error("Please select a date for the new event");
      return;
    }

    setIsAssigning(true);

    try {
      // Get the date for the event
      let eventDate: Date;
      if (isNewEvent) {
        eventDate = new Date(newEventDate);
      } else {
        const existingEvent = events.find((e) => e.event === selectedEvent);
        eventDate = existingEvent?.date ?? new Date();
      }

      await saveEventImages({
        event: eventName,
        date: eventDate,
        images: Array.from(selectedUrls),
      });

      toast.success(`Assigned ${selectedUrls.size} image(s) to "${eventName}"`);

      // Mark URLs as assigned and remove from view
      setAssignedUrls((prev) => new Set([...prev, ...selectedUrls]));
      setObjects((prev) => prev.filter((o) => !selectedUrls.has(o.url)));
      setSelectedUrls(new Set());

      // If new event, add to events list and reset form
      if (isNewEvent) {
        setEvents((prev) => [
          { id: Date.now(), event: eventName, date: eventDate },
          ...prev,
        ]);
        setNewEventName("");
        setNewEventDate("");
        setIsNewEvent(false);
      }
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error("Failed to assign images");
    } finally {
      setIsAssigning(false);
    }
  };

  // Refresh list
  const handleRefresh = () => {
    setObjects([]);
    setContinuationToken(null);
    setHasMore(true);
    fetchObjects();
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const visibleObjects = objects.filter((o) => !assignedUrls.has(o.url));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold">
            Media Recovery
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Recover orphaned photos from R2 and assign them to events
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assignment Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label>Assign to Event</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-event"
                checked={isNewEvent}
                onCheckedChange={(checked) => setIsNewEvent(checked === true)}
              />
              <label htmlFor="new-event" className="text-sm cursor-pointer">
                Create new event
              </label>
            </div>
          </div>

          {isNewEvent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-event-name">Event Name</Label>
                <Input
                  id="new-event-name"
                  placeholder="e.g., Easter Sunday 2024"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-event-date">Event Date</Label>
                <Input
                  id="new-event-date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <Label>Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an existing event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.event}>
                      {event.event} ({new Date(event.date).toLocaleDateString()}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Selection Actions */}
        <div className="flex items-center justify-between gap-4 py-2 border-y">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedUrls.size} selected of {visibleObjects.length} images
            </span>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selectedUrls.size === 0}
            >
              Clear
            </Button>
          </div>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || selectedUrls.size === 0}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Assign to Event
              </>
            )}
          </Button>
        </div>

        {/* Image Grid */}
        {visibleObjects.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orphaned images found</p>
            <p className="text-xs text-muted-foreground mt-1">
              All images in R2 have been assigned or the bucket is empty
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {visibleObjects.map((obj) => (
              <div
                key={obj.key}
                className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  selectedUrls.has(obj.url)
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => toggleSelection(obj.url)}
              >
                <Image
                  src={obj.url}
                  alt={obj.key}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  className="object-cover"
                  loading="lazy"
                  unoptimized
                />
                {/* Selection indicator */}
                <div
                  className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedUrls.has(obj.url)
                      ? "bg-primary border-primary"
                      : "bg-background/80 border-muted-foreground"
                  }`}
                >
                  {selectedUrls.has(obj.url) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {/* Hover info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {formatSize(obj.size)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more trigger */}
        <div
          ref={loadMoreRef}
          className="h-10 flex items-center justify-center"
        >
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading more images...</span>
            </div>
          )}
          {!hasMore && visibleObjects.length > 0 && (
            <span className="text-sm text-muted-foreground">
              All images loaded
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
