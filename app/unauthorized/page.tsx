import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl text-primary font-bold mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access the admin panel.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" className="cursor-pointer">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
