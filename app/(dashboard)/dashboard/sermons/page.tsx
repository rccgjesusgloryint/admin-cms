import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SermonsList } from "@/components/sermons/SermonsList";
export default function SermonsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sermons</h1>
        <Link href="/dashboard/sermons/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Sermon
          </Button>
        </Link>
      </div>
      <SermonsList />
    </div>
  );
}