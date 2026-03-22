"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createEvent } from "@/lib/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import FileUpload from "../media/file-upload";
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import { Label } from "../ui/label";
import { setDate } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// takes a tuple of dates as string and returns an object with the dates in the correct format
function formatFieldDateRange(dateRange: [string, string]): {
  from: Date;
  to: Date;
} {
  const [from, to] = dateRange;
  const correctFormat: { from: Date; to: Date } = {
    from: new Date(),
    to: new Date(),
  };

  if (from && to) {
    correctFormat.from = new Date(from);
    correctFormat.to = new Date(to);
  }
  if (from) {
    correctFormat.from = new Date(from);
  }
  return correctFormat;
}

const EventsForm = () => {
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(2025, 5, 12),
    to: new Date(2025, 6, 15),
  });
  const [open, setOpen] = React.useState(false);

  // Define the schema
  const formSchema = z
    .object({
      event: z.string().min(2).max(50),
      date: z.tuple([z.string(), z.string()]).optional(),
      location: z.string().min(15),
      description: z.object({
        eventPosterImage: z.string().optional(),
        eventDescription: z.string().min(1),
      }),
      monthly: z.boolean(),
    })
    .refine(
      (data) => data.monthly || (dateRange && dateRange.from && dateRange.to),
      {
        path: ["date"],
        message:
          "From and To dates are required when the event is not monthly.",
      }
    );

  // Infer the form data type
  type FormData = z.infer<typeof formSchema>;

  // Initialize the form with the updated schema
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      event: "",
      date: ["", ""],
      location: "",
      description: {
        eventPosterImage: "",
        eventDescription: "",
      },
      monthly: false,
    },
  });

  const monthlyValue = form.watch("monthly"); // this will return "true", "false", or undefined

  const validSubmissions = async (values: any) => {
    if (!coverImage) return alert("Please select a cover image");
    if (!dateRange) return alert("Please select a date range");
    setIsUploading(true);

    try {
      // 1) Ask server for a presigned URL
      const presignRes = await fetch("/api/upload/r2/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: [{ name: coverImage.name, type: coverImage.type }],
          prefix: `events/posters`,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignData.uploads?.[0]?.uploadUrl) {
        throw new Error("Failed to get presigned URL for image upload.");
      }
      const { uploadUrl, publicUrl, contentType } = presignData.uploads[0];

      // 2) Upload the file directly to R2
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: coverImage,
      });
      if (!put.ok) throw new Error(`Upload failed: ${coverImage.name}`);

      // 3) Use the public URL for the event poster image
      const imageUrl = publicUrl;

      const response = await toast.promise(
        createEvent({
          ...values,
          description: {
            eventPosterImage: imageUrl,
            eventDescription: values.description.eventDescription!,
          },
          date: [formatDate(dateRange.from), formatDate(dateRange.to)],
        }),
        {
          loading: "Loading",
          success: (data) => `Successfully created ${data.message}`,
          error: (err) => `This just happened: ${err.toString()}`,
        },
        {
          style: {
            border: "1px solid hsl(var(--border))",
            padding: "16px",
            color: "hsl(var(--foreground))",
            background: "hsl(var(--background))",
          },
          iconTheme: {
            primary: "hsl(var(--primary))",
            secondary: "hsl(var(--primary-foreground))",
          },
          success: {
            duration: 2000,
            icon: "🟢",
          },
        }
      );
      if (response.status === 200) {
        form.reset();
      }
    } catch (error) {
      console.log("SOMETHING WENT WRONG! COULDNT CREATE EVENT", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsUploading(false);
    }

    // Reset form on success
    setCoverImage(null);
  };

  const invalidSubmissions = async (errors: typeof form.formState.errors) => {
    const dateValue = form.watch("date");
    if (errors.date && !dateValue) {
      return toast.error("Please select a date range for the event");
    }
    if (errors.event) {
      return toast.error("event: " + errors.event.message!);
    }
    if (errors.location) {
      return toast.error("location: " + errors.location.message!);
    }
    if (errors.monthly) {
      return toast.error("isMonthly: " + errors.monthly.message!);
    }
    if (errors.description?.eventDescription) {
      return toast.error(
        "description: " + errors.description?.eventDescription.message!
      );
    }
    if (errors.description?.eventPosterImage) {
      return toast.error(
        "poster image: " + errors.description?.eventPosterImage.message!
      );
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Add upcoming events!</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(validSubmissions, invalidSubmissions)}
            className="flex flex-col gap-3 w-full"
          >
            <FormField
              control={form.control}
              name="event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Event" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Is this a Monthly event?</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => field.onChange(val === "true")}
                      value={String(field.value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Yes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditionally render date fields if monthly is "false" */}
            {!monthlyValue && (
              <>
                {/* <Input
                              id="date"
                              value={`${dateRange?.from} - ${dateRange?.to}`}
                              placeholder="June 01, 2025"
                              className="bg-background pr-10"
                              onKeyDown={(e) => {
                                if (e.key === "ArrowDown") {
                                  e.preventDefault()
                                  setOpen(true)
                                }
                              }}
                              /> */}

                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-fit justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange ? (
                        <>
                          {formatDate(dateRange.from)} -{" "}
                          {dateRange.to && formatDate(dateRange.to)}
                        </>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="range"
                      onSelect={setDateRange}
                      selected={dateRange}
                      className="rounded-lg border shadow-sm w-[300px]"
                    />
                  </PopoverContent>
                </Popover>
                {/* <Label>{dateRange?.from && formatDate(dateRange.from)} {dateRange?.to && " - " + formatDate(dateRange.to)}</Label> */}
              </>
            )}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="The address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description.eventPosterImage"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      value={coverImage}
                      onChange={setCoverImage}
                      label="Event Poster Image"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description.eventDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventsForm;
