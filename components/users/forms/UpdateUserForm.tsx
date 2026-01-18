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
import { zodResolver } from "@hookform/resolvers/zod";
import React, { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { updateUsersRole } from "@/lib/queries";
import { Role, User } from "@prisma/client";
import { Input } from "@/components/ui/input";

interface Props {
  user: User;
  setRefresh: Dispatch<SetStateAction<boolean>>;
  setClose: () => void;
}

const UpdateUserForm = ({ user, setRefresh, setClose }: Props) => {
  const formSchema = z.object({
    role: z.enum([
      "MEMBER",
      "MINISTER",
      "ADMIN_GENERAL",
      "ADMIN_MODERATE",
      "ADMIN_FULL",
      "OWNER",
    ]),
  });

  type FormData = z.infer<typeof formSchema>;

  // Map old roles to new ones for backwards compatibility
  const getDefaultRole = (): FormData["role"] => {
    const role = user.member;
    if (
      role === "MEMBER" ||
      role === "MINISTER" ||
      role === "ADMIN_GENERAL" ||
      role === "ADMIN_MODERATE" ||
      role === "ADMIN_FULL" ||
      role === "OWNER"
    ) {
      return role;
    }
    return "MEMBER";
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      role: getDefaultRole(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await toast.promise(
        updateUsersRole(user.id, values.role as Role),
        {
          loading: "Updating user role...",
          success: (data) => `Successfully updated user role!`,
          error: (err) => `Error updating role: ${err.toString()}`,
        },
      );

      if (response.status === 200) {
        setRefresh((prev) => !prev);
        setClose();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-5">
      <CardHeader>
        <CardTitle>Update User Role</CardTitle>
        <CardDescription>
          Change the role for {user.name || user.email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>User Email</FormLabel>
              <Input value={user.email || ""} disabled />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="MINISTER">Minister</SelectItem>
                      <SelectItem value="ADMIN_GENERAL">
                        Admin: General (Events & Media)
                      </SelectItem>
                      <SelectItem value="ADMIN_MODERATE">
                        Admin: Moderate (+ Sermons & Blogs)
                      </SelectItem>
                      <SelectItem value="ADMIN_FULL">
                        Admin: Full Access
                      </SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Update Role
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UpdateUserForm;
