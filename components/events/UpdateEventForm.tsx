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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";
import { z } from "zod";

import toast from "react-hot-toast";
import { updateEvent } from "@/lib/queries";
import { EventsType } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

import { Input } from "@/components/ui/input";

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  oldEvent: EventsType;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  setClose: () => void;
}

const UpdateEventForm = ({ oldEvent, setRefresh, setClose }: Props) => {
  // Parse existing date strings into Date objects for the calendar
  const initialDateRange: DateRange | undefined = (() => {
    const from = oldEvent.date?.[0] ? new Date(oldEvent.date[0]) : undefined;
    const to = oldEvent.date?.[1] ? new Date(oldEvent.date[1]) : undefined;
    if (from && !isNaN(from.getTime())) {
      return { from, to: to && !isNaN(to.getTime()) ? to : undefined };
    }
    return undefined;
  })();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
  const [open, setOpen] = useState(false);

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
        message: "From and To dates are required when the event is not monthly.",
      }
    );

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
      monthly: oldEvent.monthly ?? false,
    },
  });

  const monthlyValue = form.watch("monthly");

  const onInvalidSubmit = (errors: typeof form.formState.errors) => {
    if (errors.event) {
      return toast.error("Event: " + errors.event.message!);
    }
    if (errors.date) {
      return toast.error("Date: Please provide a valid date range");
    }
    if (errors.location) {
      return toast.error("Location: " + errors.location.message!);
    }
    if (errors.description?.eventDescription) {
      return toast.error(
        "Description: " + errors.description.eventDescription.message!
      );
    }
    if (errors.description?.eventPosterImage) {
      return toast.error(
        "Poster image: " + errors.description.eventPosterImage.message!
      );
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!oldEvent.id) return alert("No event Id provided!");
    try {
      const eventData = {
        ...values,
        date: monthlyValue
          ? ["", ""]
          : [formatDate(dateRange?.from), formatDate(dateRange?.to)],
      };
      const response = await toast.promise(
        updateEvent(oldEvent.id, eventData as EventsType),
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
          <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="w-full">
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
                        <SelectValue placeholder="No" />
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

            {/* Conditionally render date picker if not monthly */}
            {!monthlyValue && (
              <div className="flex flex-col gap-2">
                <FormLabel>Event Date Range</FormLabel>
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
              </div>
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
