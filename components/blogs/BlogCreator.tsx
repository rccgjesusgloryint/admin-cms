import React from "react";

import dynamic from "next/dynamic";

import "react-quill/dist/quill.snow.css"; // include styles

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postBlog } from "@/lib/queries";
import toast from "react-hot-toast";

import { forwardRef } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {
  userId: string | undefined;
};

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface BlogCreatorProps {
  field: ControllerRenderProps<any, string>;
}

// Wrap ReactQuill in forwardRef to prevent ref warnings
const QuillEditor = forwardRef(({ field }: BlogCreatorProps, ref) => (
  <ReactQuill
    value={field.value}
    onChange={(content) => field.onChange(content)}
  />
));
QuillEditor.displayName = "QuillEditor"; // Required for React dev tools

const BlogCreator = ({ userId }: Props) => {
  const formSchema = z.object({
    blogTitle: z
      .string()
      .min(10, {
        message: "Your title is too short!",
      })
      .max(50, {
        message: "Your title is too long!",
      }),
    category: z.string().max(30, {
      message: "This category name is too big try something smaller",
    }),
    blogDescription: z
      .string()
      .min(30, "Your description must be longer than this!")
      .max(450, {
        message: "Your description cant be longer than 450 characters!",
      }),
    blogImage: z.any().optional(),
    blogContent: z
      .string()
      .min(2, { message: "This is not enough content for a Blog!" }),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      blogTitle: "",
      blogDescription: "",
      blogImage: "",
      blogContent: "",
      category: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form Data: ", values.blogImage);
    try {
      await toast.promise(
        postBlog(
          {
            blogContent: values.blogContent,
            blogDescription: values.blogDescription,
            blogTitle: values.blogTitle,
            category: values.category,
            blogImage: values.blogImage || null,
          },
          userId
        ),
        {
          loading: "Loading",
          success: (data) => `You successfully posted a blog!`,
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

      form.reset();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <Card className="sm:p-[10rem] min-h-[500px]">
        <CardHeader>
          <CardTitle className="font-bold">
            <CardDescription className="text-4xl">
              Create a new blog
            </CardDescription>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-3"
            >
              <FormField
                control={form.control}
                name="blogTitle"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Blog Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Who created God?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* TO DO: Implement AI to create the decription for the user, from the users Content and blog title */}
              <FormField
                control={form.control}
                name="blogDescription"
                render={({ field }: {field: any}) => (
                  <FormItem>
                    <span>{}</span>
                    <FormLabel>Blog Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give a brief description of what to expect in this blog..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* TO DO: Implement document pklaygrounf for custom writing formatting. eg. Bold, Italic, H1 , H2 etc */}
              <FormField
                control={form.control}
                name="blogContent"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Blog Content</FormLabel>
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

              <FormField
                control={form.control}
                name="category"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Blog Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What category would this blog fall under?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="blogImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poster Image</FormLabel>
                    <FormControl>
                      <FileUpload onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <Button type="submit" className="mt-5">
                Post Blog
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default BlogCreator;
