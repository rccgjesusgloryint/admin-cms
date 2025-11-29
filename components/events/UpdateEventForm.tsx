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
import { useForm } from "react-hook-form";
import { z } from "zod";

import toast from "react-hot-toast";
import { updateEvent } from "@/lib/queries";
import { EventsType } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

import { Input } from "@/components/ui/input";

interface Props {
  oldEvent: EventsType;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  setClose: () => void;
}

const UpdateEventForm = ({ oldEvent, setRefresh, setClose }: Props) => {
  // Define the schema
  const formSchema = z.object({
    event: z.string().min(2).max(50),
    date: z.tuple([z.string().min(1), z.string()]),
    location: z.string().min(15),
    description: z.object({
      eventPosterImage: z.string().min(1).optional(),
      eventDescription: z.string().min(1),
    }),
  });

  // Infer the form data type
  type FormData = z.infer<typeof formSchema>;

  // Initialize the form with the updated schema
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      event: oldEvent.event || "",
      date: [
        (oldEvent.date && oldEvent.date[0]) || "",
        (oldEvent.date && oldEvent.date[1]) || "",
      ],
      location: oldEvent.location || "",
      description: {
        eventPosterImage: oldEvent.description.eventPosterImage || "",
        eventDescription: oldEvent.description.eventDescription || "",
      },
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!oldEvent.id) return alert("No event Id provided!");
    try {
      const response = await toast.promise(
        updateEvent(oldEvent.id, values as EventsType),
        {
          loading: "Loading",
          success: (data) => `Successfully updated Event! ${data.message}`,
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
        setRefresh((prev) => !prev); // 🔄 Toggle state to trigger rerender
        setClose();
      }
    } catch (error) {
      console.log("ERROR Updating User");
    }
  }

  return (
    <Card className="w-full h-full mt-5">
      <CardHeader>
        <CardTitle>
          <CardDescription>Update Event</CardDescription>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-5 w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
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
              name="date.0"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Date</FormLabel>
                  <FormControl>
                    <Input placeholder="From (eg. April 28, 2022)" {...field} />
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
                    <Input placeholder="To (eg. April 30, 2022)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            {/* <FormField
              control={form.control}
              name="description.eventPosterImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Poster Image</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="eventPosterImage"
                      onChange={field.onChange}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
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
            <Button type="submit">Update Event</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UpdateEventForm;
