"use client";

import React from "react";

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

import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";
import { number, z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import TagCreator from "../global/tag-creator";
import { createSermon } from "@/lib/queries";

// // Example usage
// const youtubeLink = "https://youtu.be/W7dx30ATm4M?si=aGMQO0oqrgECGJoA";
// const thumbnailUrl = getYoutubeThumbnailUrl(youtubeLink);
// console.log(thumbnailUrl); // Output: https://img.youtube.com/vi/W7dx30ATm4M/hqdefault.jpg

const CreateSermonForm = () => {
  const [tags, setTags] = React.useState<string[]>([]);

  const formSchema = z.object({
    id: z.number().min(2).optional(),
    videoUrl: z.string().min(2).max(50),
    sermonTitle: z.string().min(2).max(50),
    thumbnail: z.string().min(2),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      videoUrl: "",
      sermonTitle: "",
      thumbnail: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (tags.length < 1) {
      return alert("Please add a tag");
    }
    try {
      const response = await toast.promise(
        createSermon(values, tags),
        {
          loading: "Loading",
          success: (data) => `Successfully created sermon!`,
          error: (err) => `OOPS!! This just happened: ${err.toString()}`,
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
        form.resetField("videoUrl");
        form.resetField("sermonTitle");
        setTags([]);
      }
    } catch (error) {}
  }
  return (
    <>
      <Card className="w-auto h-auto mt-5">
        <CardHeader>
          <CardTitle>
            <CardDescription>
              Please enter the details for your file
            </CardDescription>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sermon Video Url</FormLabel>
                    <FormControl>
                      <Input placeholder="https://localhost:3000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sermonTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sermon Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Are you a child of God?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sermon Tags</FormLabel>
                    <FormControl>
                      <TagCreator tags={tags} setTags={setTags} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Create Sermon</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default CreateSermonForm;
