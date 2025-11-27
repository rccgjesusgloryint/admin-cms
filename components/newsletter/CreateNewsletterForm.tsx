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
import { Input } from "@/components/ui/input";
import { sendBulkNewsletterEmail } from "@/lib/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { forwardRef } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

interface NewsletterFormProps {
  field: ControllerRenderProps<any, string>;
}

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
// Wrap ReactQuill in forwardRef to prevent ref warnings
const QuillEditor = forwardRef(({ field }: NewsletterFormProps, ref) => (
  <ReactQuill
    value={field.value}
    onChange={(content) => field.onChange(content)}
  />
));
QuillEditor.displayName = "QuillEditor"; // Required for React dev tools

const CreateNewsletterForm = () => {
  // Define the schema
  const formSchema = z.object({
    subject: z.string().min(5).max(50),
    content: z.string().min(5),
  });

  // Infer the form data type
  type FormData = z.infer<typeof formSchema>;

  // Initialize the form with the updated schema
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      subject: "",
      content: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // if )) retur n alert("No event Id provided!");
    try {
      await toast.promise(
        sendBulkNewsletterEmail(values),
        {
          loading: "Loading",
          success: (data) => `Successfully sent out Newsletter`,
          error: (err) => `${err.toString()}`,
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

      form.reset();
    } catch (error) {
      console.log("ERROR Sending Newsletter: ", error);
    }
  }

  return (
    <Card className="w-full h-full mt-5">
      <CardHeader>
        <CardTitle>Newsletter Form</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <ReactQuill
                      value={field.value} // Explicitly set the value
                      onChange={(content) => field.onChange(content)} // Ensure React Hook Form updates state correctly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit">Send</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateNewsletterForm;
