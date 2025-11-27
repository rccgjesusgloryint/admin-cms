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

const EventsForm = () => {
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      (data) =>
        data.monthly ||
        (data.date && data.date[0].trim() && data.date[1].trim()),

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
    setIsUploading(true);
    // 1) Ask server for *one* presigned URL
    const presignRes = await fetch("/api/upload/file-presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: coverImage.name,
        type: coverImage.type,
        prefix: `posts/${coverImage.name}`,
      }),
    });
    const { key, uploadUrl, publicUrl, contentType } = await presignRes.json();

    if (!uploadUrl) throw new Error("Failed to get presigned URL.");

    // 2) Upload the file directly to R2
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: coverImage,
    });

    if (!put.ok) throw new Error(`Upload failed: ${coverImage.name}`);

    // 3) Commit metadata (including the *one* URL) to your DB
    const imageUrl = publicUrl;

    // --- IMPORTANT ---
    // Here you would call your *new* server action to save
    // the post data and the single image URL.
    //
    // await savePostToDatabase({
    //   title: title,
    //   description: description,
    //   imageUrl: imageUrl,
    // });
    //
    // For this example, we'll just log it:

    try {
      const response = await toast.promise(
        createEvent({
          ...values,
          description: {
            eventPosterImage: imageUrl,
            eventDescription: values.description.eventDescription!,
          },
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
      console.log("SOMETHING WENT WRONG! COULDNT CREATE EVENT");
      toast.error("Please fix the form errors before submitting.");
    }

    // Reset form on success
    setCoverImage(null);
  };

  const invalidSubmissions = async (errors: typeof form.formState.errors) => {
    if (errors.date) {
      return toast.error("Please fill in the dates for the event");
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
            className="flex flex-col gap-3"
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
                <FormField
                  control={form.control}
                  name="date.0"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="From (eg. April 28, 2022)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date.1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="To (eg. April 30, 2022)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  <FormLabel>Event Poster Image</FormLabel>
                  <FormControl>
                    <FileUpload value={coverImage} onChange={setCoverImage} />
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
              <Button type="submit">Create Event</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EventsForm;
