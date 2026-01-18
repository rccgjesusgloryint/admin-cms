import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { getNotificationCounts } from "@/lib/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch notification counts for the sidebar
  const notificationCounts = userId
    ? await getNotificationCounts(userId)
    : { feedback: 0, users: 0 };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar
        notificationCounts={notificationCounts}
        userId={userId}
        userRole={session?.user?.member}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session?.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
