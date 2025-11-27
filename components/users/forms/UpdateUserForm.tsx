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
    role: z.enum(["ADMIN", "MEMBER", "OWNER", "MINISTER"]),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      role: (user.member as "ADMIN" | "MEMBER" | "OWNER" | "MINISTER") || "MEMBER",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await toast.promise(
        updateUsersRole(user.id, values.role),
        {
          loading: "Updating user role...",
          success: (data) => `Successfully updated user role!`,
          error: (err) => `Error updating role: ${err.toString()}`,
        }
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
        <CardDescription>Change the role for {user.name || user.email}</CardDescription>
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
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MINISTER">Minister</SelectItem>
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
