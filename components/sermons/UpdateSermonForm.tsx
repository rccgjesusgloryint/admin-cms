"use client";

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

import { zodResolver } from "@hookform/resolvers/zod";
import React, { Dispatch, SetStateAction } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

import toast from "react-hot-toast";
import {
  generateAISermonBreakdown,
  generateAiSummary,
  updateSermon,
} from "@/lib/queries";
import { Sermon } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { getYoutubeVidId } from "@/lib/actions";
import { ModelStatusPreview } from "@/components/ai/ModelStatusPreview";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface Props {
  sermon: Sermon;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  setClose: () => void;
}

const UpdateSermonForm = ({ sermon, setRefresh, setClose }: Props) => {
  const [tags, setTags] = React.useState<string[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [emptyAiFeatures, setEmptyAiFeatures] = React.useState<boolean>(
    sermon.videoTranscript === "" || sermon.aiBreakdown === ""
  );

  const formSchema = z.object({
    videoUrl: z.string().min(2).max(50),
    sermonTitle: z.string().min(2).max(50),
    thumbnail: z.string().min(2),
    aiBreakdown: z.string().optional(),
    videoTranscript: z.string().optional(),
    summary: z.string().optional(),
    sermonResources: z.array(z.object({ value: z.string() })).optional(),
    speaker: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      videoUrl: sermon.videoUrl || "",
      sermonTitle: sermon.sermonTitle || "",
      thumbnail: sermon.thumbnail || "",
      sermonResources: sermon.sermonResources?.map((r) => ({ value: r })) || [
        { value: "" },
      ],
      aiBreakdown: sermon.aiBreakdown || "",
      videoTranscript: sermon.videoTranscript || "",
      summary: sermon.summary || "",
      speaker: sermon.speaker || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sermonResources",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!sermon.id) return alert("No sermon provided!");

    const filteredResources =
      values.sermonResources
        ?.map((r) => r.value)
        .filter((resource) => resource.trim() !== "") || [];

    let tempSermon = {
      videoUrl: values.videoUrl,
      sermonTitle: values.sermonTitle,
      thumbnail: values.thumbnail,
      aiBreakdown: values.aiBreakdown || "",
      videoTranscript: values.videoTranscript || "",
      summary: values.summary || "",
      speaker: values.speaker || "",
      sermonResources: filteredResources,
      hasNotes: filteredResources.length !== 0,
      tags,
    };

    try {
      const response = await toast.promise(
        updateSermon(sermon.id, { ...tempSermon }),
        {
          loading: "Loading",
          success: (data) => `Successfully updated ${data.message}`,
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
        setRefresh((prev) => !prev);
        setClose();
      }
    } catch (error) {
      console.log("ERROR Updating Sermon:", error);
    }
  }
  async function handleGenerateSummary() {
    const transcript = form.getValues("videoTranscript");
    if (!transcript || transcript.trim() === "") {
      toast.error("Please provide a video transcript first.");
      return;
    }

    if (!sermon.id) {
      toast.error("Sermon ID is missing.");
      return;
    }

    try {
      setIsGenerating(true);

      // Validate and extract YouTube video ID
      let videoId: string;
      try {
        videoId = getYoutubeVidId(sermon.videoUrl);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid YouTube URL";
        toast.error(`Invalid video URL: ${errorMessage}`);
        setIsGenerating(false);
        return;
      }

      // Generate AI features sequentially to better handle errors
      try {
        const generatedSummary = await generateAiSummary(transcript, sermon.id);
        form.setValue("summary", generatedSummary);
        toast.success("AI Summary generated successfully!");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error generating AI summary:", error);
        toast.error(`Failed to generate AI summary: ${errorMessage}`);
        setIsGenerating(false);
        return;
      }

      try {
        const generateBreakdown = await generateAISermonBreakdown(
          sermon.id,
          transcript,
          videoId
        );
        form.setValue("aiBreakdown", generateBreakdown);
        toast.success("AI Breakdown generated successfully!");
        setEmptyAiFeatures((prev) => !prev);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error generating AI breakdown:", error);
        toast.error(`Failed to generate AI breakdown: ${errorMessage}`);
        // Don't return here - summary was successful, just breakdown failed
      }
    } catch (error) {
      console.error("Error generating ai features:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to generate AI features: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card className="w-full h-full mt-5">
      <CardHeader>
        <CardTitle>
          <CardDescription>Update Sermon</CardDescription>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-4"
          >
            <div className="flex justify-end items-center gap-3">
              <ModelStatusPreview />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateSummary}
                disabled={isGenerating || !emptyAiFeatures}
                className="cursor-pointer"
              >
                {isGenerating ? "Generating..." : "Generate AI Features"}
              </Button>
            </div>
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
              control={form.control}
              name="videoTranscript"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Transcript</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the video transcript here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the ai summary here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiBreakdown"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Breakdown</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the ai breakdown here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl>
                    <Input placeholder="Thumbnail url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="speaker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaker</FormLabel>
                  <FormControl>
                    <Input placeholder="Speaker" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Sermon Resources</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "" })}
                  className="h-8 gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Resource
                </Button>
              </div>

              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`sermonResources.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <div className="flex-1">
                            <ReactQuill
                              value={field.value}
                              onChange={(content) => field.onChange(content)}
                              placeholder="Enter sermon resource content..."
                            />
                          </div>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                              className="self-end"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Button type="submit" className="mt-4">
              Update Sermon
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UpdateSermonForm;
