"use server";

import { Resend } from "resend";
import { prisma } from "./db";
import { Role } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

// Activity types that can trigger notifications
export type ActivityType =
  | "new_user"
  | "new_blog"
  | "new_sermon"
  | "new_event"
  | "new_feedback"
  | "edited_blog"
  | "edited_sermon"
  | "edited_event";

// Data payload for each activity type
export interface ActivityData {
  title?: string;
  name?: string;
  email?: string;
  author?: string;
  message?: string;
  category?: string;
  editor?: string;
}

// Map activity types to preference fields
const ACTIVITY_TO_PREFERENCE: Record<ActivityType, string> = {
  new_user: "notifyNewUsers",
  new_blog: "notifyNewBlogs",
  new_sermon: "notifyNewSermons",
  new_event: "notifyNewEvents",
  new_feedback: "notifyNewFeedback",
  edited_blog: "notifyEditedBlogs",
  edited_sermon: "notifyEditedSermons",
  edited_event: "notifyEditedEvents",
};

// Activity labels for email subject
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  new_user: "New User Registered",
  new_blog: "New Blog Post Created",
  new_sermon: "New Sermon Added",
  new_event: "New Event Created",
  new_feedback: "New Feedback Received",
  edited_blog: "Blog Post Updated",
  edited_sermon: "Sermon Updated",
  edited_event: "Event Updated",
};

/**
 * Get all ADMIN_FULL and OWNER users with their notification preferences
 */
async function getAdminUsersWithPreferences() {
  const adminRoles: Role[] = ["ADMIN_FULL", "OWNER"];

  const admins = await prisma.user.findMany({
    where: {
      member: { in: adminRoles },
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailNotificationPreference: true,
    },
  });

  return admins;
}

/**
 * Check if a user should receive notifications for an activity type
 */
function shouldNotify(
  preferences: { [key: string]: boolean } | null,
  activityType: ActivityType,
): boolean {
  if (!preferences) {
    // If no preferences set, default to true (send notifications)
    return true;
  }
  const prefKey = ACTIVITY_TO_PREFERENCE[activityType];
  return preferences[prefKey] !== false;
}

/**
 * Generate HTML email content for an activity notification
 */
function generateEmailHtml(
  activityType: ActivityType,
  data: ActivityData,
): string {
  const label = ACTIVITY_LABELS[activityType];
  const isEdit = activityType.startsWith("edited_");

  let detailsHtml = "";

  switch (activityType) {
    case "new_user":
      detailsHtml = `
        <p><strong>Name:</strong> ${data.name || "Not provided"}</p>
        <p><strong>Email:</strong> ${data.email || "Not provided"}</p>
      `;
      break;
    case "new_blog":
    case "edited_blog":
      detailsHtml = `
        <p><strong>Title:</strong> ${data.title || "Untitled"}</p>
        ${data.category ? `<p><strong>Category:</strong> ${data.category}</p>` : ""}
        ${isEdit && data.editor ? `<p><strong>Edited by:</strong> ${data.editor}</p>` : ""}
      `;
      break;
    case "new_sermon":
    case "edited_sermon":
      detailsHtml = `
        <p><strong>Title:</strong> ${data.title || "Untitled"}</p>
        ${isEdit && data.editor ? `<p><strong>Edited by:</strong> ${data.editor}</p>` : ""}
      `;
      break;
    case "new_event":
    case "edited_event":
      detailsHtml = `
        <p><strong>Event:</strong> ${data.title || "Untitled"}</p>
        ${isEdit && data.editor ? `<p><strong>Edited by:</strong> ${data.editor}</p>` : ""}
      `;
      break;
    case "new_feedback":
      detailsHtml = `
        <p><strong>From:</strong> ${data.name || data.email || "Anonymous"}</p>
        ${data.category ? `<p><strong>Category:</strong> ${data.category}</p>` : ""}
        ${data.message ? `<p><strong>Message:</strong> ${data.message.substring(0, 200)}${data.message.length > 200 ? "..." : ""}</p>` : ""}
      `;
      break;
  }

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${label}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: ${isEdit ? "#f59e0b" : "#0073e6"};
            color: #ffffff;
            padding: 15px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        h1 {
            margin: 0;
            font-size: 20px;
        }
        .badge {
            display: inline-block;
            background: ${isEdit ? "#d97706" : "#0056b3"};
            color: #ffffff;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-bottom: 10px;
        }
        .content {
            padding: 20px;
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
        }
        .details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .details p {
            margin: 8px 0;
        }
        .button {
            display: inline-block;
            background: #0073e6;
            color: #ffffff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 15px;
        }
        .footer {
            font-size: 14px;
            color: #777777;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eeeeee;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">${isEdit ? "UPDATE" : "NEW"}</span>
            <h1>${label}</h1>
        </div>
        <div class="content">
            <p>Hello Admin,</p>
            <p>A new activity has occurred in the Jesus Glory Admin Portal:</p>
            <div class="details">
                ${detailsHtml}
            </div>
            <a href="${process.env.BASE_URL || "https://admin.jesusgloryintl.com"}/dashboard" class="button">View in Dashboard</a>
        </div>
        <div class="footer">
            <p>This is an automated notification from Jesus Glory Admin Portal.</p>
            <p>You can manage your notification preferences in Settings.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send an activity notification email to a specific recipient
 */
async function sendActivityEmail(
  to: string,
  activityType: ActivityType,
  data: ActivityData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const label = ACTIVITY_LABELS[activityType];
    const html = generateEmailHtml(activityType, data);

    const { error } = await resend.emails.send({
      from: "Jesus Glory Admin <notifications@jesusgloryintl.com>",
      to: to,
      subject: `[Admin Alert] ${label}`,
      html: html,
    });

    if (error) {
      console.error(`Failed to send notification to ${to}:`, error);
      return { success: false, error: String(error) };
    }

    return { success: true };
  } catch (error) {
    console.error(`Error sending notification to ${to}:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Notify all ADMIN_FULL and OWNER users about an activity
 * Respects individual notification preferences
 */
export async function notifyAdmins(
  activityType: ActivityType,
  data: ActivityData,
): Promise<void> {
  try {
    const admins = await getAdminUsersWithPreferences();

    const emailPromises = admins
      .filter((admin) => {
        // Cast preferences to the expected type for checking
        const prefs = admin.emailNotificationPreference as unknown as {
          [key: string]: boolean;
        } | null;
        return shouldNotify(prefs, activityType);
      })
      .map((admin) => sendActivityEmail(admin.email, activityType, data));

    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;
    const failed = results.length - successful;

    if (failed > 0) {
      console.warn(
        `Admin notifications: ${successful} sent, ${failed} failed for ${activityType}`,
      );
    } else if (successful > 0) {
      console.log(
        `Admin notifications: ${successful} sent successfully for ${activityType}`,
      );
    }
  } catch (error) {
    // Don't throw - notification failures shouldn't break the main operation
    console.error("Error sending admin notifications:", error);
  }
}
