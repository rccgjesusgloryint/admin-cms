import { getSiteSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();
  const settings = await getSiteSettings();
  const mediaToolUrl = process.env.MEDIA_TOOL_URL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your church admin portal configuration
        </p>
      </div>

      <SettingsForm
        settings={settings}
        userId={session?.user?.id}
        mediaToolUrl={mediaToolUrl}
      />
    </div>
  );
}
