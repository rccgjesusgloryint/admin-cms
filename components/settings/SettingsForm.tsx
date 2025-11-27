"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import toast from "react-hot-toast";
import { updateSiteSettings } from "@/lib/queries";
import { useTheme } from "next-themes";

interface Props {
  settings: any;
  userId?: string;
}

const settingsSchema = z.object({
  churchName: z.string().min(1, "Church name is required"),
  description: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
  primaryColor: z.string().optional(),
  allowRegistration: z.boolean().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsForm({ settings, userId }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, setTheme } = useTheme();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      churchName: settings.churchName || "Church Admin",
      description: settings.description || "",
      contactEmail: settings.contactEmail || "",
      contactPhone: settings.contactPhone || "",
      address: settings.address || "",
      socialLinks: settings.socialLinks || {
        facebook: "",
        instagram: "",
        youtube: "",
        twitter: "",
      },
      primaryColor: settings.primaryColor || "#0088FE",
      allowRegistration: settings.allowRegistration ?? true,
    },
  });

  async function onSubmit(data: SettingsFormData) {
    setIsSubmitting(true);
    try {
      await updateSiteSettings(data, userId);
      toast.success("Settings updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Church Information</CardTitle>
                <CardDescription>Basic information about your church</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="churchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Church Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Baptist Church" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A welcoming community..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@church.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Connect your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="socialLinks.facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/yourchurch" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/yourchurch" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.youtube"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/@yourchurch" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter/X</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/yourchurch" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Integrations</CardTitle>
                <CardDescription>Configure external service integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>YouTube API</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure via environment variables: YOUTUBE_API_KEY, YOUTUBE_API_BASE_URL
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {process.env.NEXT_PUBLIC_YOUTUBE_CONFIGURED ? "✅ Configured" : "⚠️ Not configured"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Email Service (Resend)</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure via environment variables: RESEND_API_KEY
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Storage (R2)</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure via environment variables for Cloudflare R2
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input type="color" {...field} className="w-20 h-10" />
                          <Input {...field} placeholder="#0088FE" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Choose a primary color for the admin portal
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                  <Label>Theme Preference</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={`cursor-pointer rounded-lg border-2 p-4 hover:bg-accent ${theme === 'light' ? 'border-primary' : 'border-muted'}`}
                      onClick={() => setTheme("light")}
                    >
                      <div className="mb-2 h-20 rounded-md bg-[#ffffff] border border-slate-200 shadow-sm" />
                      <div className="text-center font-medium">Light</div>
                    </div>
                    <div 
                      className={`cursor-pointer rounded-lg border-2 p-4 hover:bg-accent ${theme === 'dark' ? 'border-primary' : 'border-muted'}`}
                      onClick={() => setTheme("dark")}
                    >
                      <div className="mb-2 h-20 rounded-md bg-[#09090b] border border-slate-800 shadow-sm" />
                      <div className="text-center font-medium">Dark</div>
                    </div>
                    <div 
                      className={`cursor-pointer rounded-lg border-2 p-4 hover:bg-accent ${theme === 'system' ? 'border-primary' : 'border-muted'}`}
                      onClick={() => setTheme("system")}
                    >
                      <div className="mb-2 h-20 rounded-md bg-gradient-to-r from-[#ffffff] to-[#09090b] border border-slate-200 shadow-sm" />
                      <div className="text-center font-medium">System</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred interface theme
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security & Access</CardTitle>
                <CardDescription>Control user access and registration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowRegistration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow User Registration
                        </FormLabel>
                        <FormDescription>
                          Enable or disable new user signups
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
