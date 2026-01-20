"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  UserPlus,
  FileText,
  Video,
  Calendar,
  MessageSquare,
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";
import { Role } from "@prisma/client";
import {
  getEmailNotificationPreferences,
  updateEmailNotificationPreferences,
  type EmailNotificationPreferencesData,
} from "@/lib/queries";

interface Props {
  userId?: string;
  userRole?: Role;
}

const NOTIFICATION_OPTIONS = [
  {
    key: "notifyNewUsers" as const,
    label: "New User Registrations",
    description: "Get notified when a new user signs up",
    icon: UserPlus,
    category: "new",
  },
  {
    key: "notifyNewBlogs" as const,
    label: "New Blog Posts",
    description: "Get notified when a new blog post is created",
    icon: FileText,
    category: "new",
  },
  {
    key: "notifyNewSermons" as const,
    label: "New Sermons",
    description: "Get notified when a new sermon is added",
    icon: Video,
    category: "new",
  },
  {
    key: "notifyNewEvents" as const,
    label: "New Events",
    description: "Get notified when a new event is created",
    icon: Calendar,
    category: "new",
  },
  {
    key: "notifyNewFeedback" as const,
    label: "New Feedback",
    description: "Get notified when new feedback is submitted",
    icon: MessageSquare,
    category: "new",
  },
  {
    key: "notifyEditedBlogs" as const,
    label: "Edited Blog Posts",
    description: "Get notified when a blog post is updated",
    icon: Edit,
    category: "edit",
  },
  {
    key: "notifyEditedSermons" as const,
    label: "Edited Sermons",
    description: "Get notified when a sermon is updated",
    icon: Edit,
    category: "edit",
  },
  {
    key: "notifyEditedEvents" as const,
    label: "Edited Events",
    description: "Get notified when an event is updated",
    icon: Edit,
    category: "edit",
  },
];

export function EmailNotificationSettings({ userId, userRole }: Props) {
  const [preferences, setPreferences] =
    useState<EmailNotificationPreferencesData>({
      notifyNewUsers: true,
      notifyNewBlogs: true,
      notifyNewSermons: true,
      notifyNewEvents: true,
      notifyNewFeedback: true,
      notifyEditedBlogs: true,
      notifyEditedSermons: true,
      notifyEditedEvents: true,
    });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] =
    useState<EmailNotificationPreferencesData | null>(null);

  // Only show for ADMIN_FULL and OWNER roles
  const isEligible = userRole === "ADMIN_FULL" || userRole === "OWNER";

  useEffect(() => {
    if (userId && isEligible) {
      loadPreferences();
    } else {
      setIsLoading(false);
    }
  }, [userId, isEligible]);

  async function loadPreferences() {
    if (!userId) return;

    try {
      const prefs = await getEmailNotificationPreferences(userId);
      if (prefs) {
        setPreferences(prefs);
        setOriginalPreferences(prefs);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleToggle(
    key: keyof EmailNotificationPreferencesData,
    value: boolean,
  ) {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      // Check if different from original
      if (originalPreferences) {
        const changed = Object.keys(updated).some(
          (k) =>
            updated[k as keyof EmailNotificationPreferencesData] !==
            originalPreferences[k as keyof EmailNotificationPreferencesData],
        );
        setHasChanges(changed);
      } else {
        setHasChanges(true);
      }
      return updated;
    });
  }

  async function handleSave() {
    if (!userId) return;

    setIsSaving(true);
    try {
      await updateEmailNotificationPreferences(userId, preferences);
      setOriginalPreferences(preferences);
      setHasChanges(false);
      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleAll(enabled: boolean) {
    const updated = Object.keys(preferences).reduce((acc, key) => {
      acc[key as keyof EmailNotificationPreferencesData] = enabled;
      return acc;
    }, {} as EmailNotificationPreferencesData);
    setPreferences(updated);

    if (originalPreferences) {
      const changed = Object.keys(updated).some(
        (k) =>
          updated[k as keyof EmailNotificationPreferencesData] !==
          originalPreferences[k as keyof EmailNotificationPreferencesData],
      );
      setHasChanges(changed);
    } else {
      setHasChanges(true);
    }
  }

  if (!isEligible) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Email notification settings are only available for Full Admin users.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Loading notification preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const newContentOptions = NOTIFICATION_OPTIONS.filter(
    (o) => o.category === "new",
  );
  const editContentOptions = NOTIFICATION_OPTIONS.filter(
    (o) => o.category === "edit",
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Configure which activities trigger email notifications to your
              inbox
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleAll(true)}
            >
              Enable All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleAll(false)}
            >
              Disable All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Content Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            New Content
          </h4>
          <div className="space-y-3">
            {newContentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label className="text-base">{option.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[option.key]}
                    onCheckedChange={(checked) =>
                      handleToggle(option.key, checked)
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Edited Content Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Content Updates
          </h4>
          <div className="space-y-3">
            {editContentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <Label className="text-base">{option.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[option.key]}
                    onCheckedChange={(checked) =>
                      handleToggle(option.key, checked)
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
