import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getModelStatuses, AI_MODELS } from "@/lib/ai-config";
import { isAdmin } from "@/lib/queries";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const statusMap = getModelStatuses();
    const statuses = AI_MODELS.map((model) => {
      const status = statusMap.get(model);
      // If model has been tested, use its actual status
      // If not tested, default to available: false (unknown state)
      const isAvailable = status?.hasBeenTested
        ? status.available ?? false
        : false;

      return {
        model,
        available: isAvailable,
        hasBeenTested: status?.hasBeenTested ?? false,
        lastChecked: status?.lastChecked,
        lastFailure: status?.lastFailure,
        errorCount: status?.errorCount ?? 0,
        lastError: status?.lastError,
      };
    });

    return NextResponse.json({ statuses }, { status: 200 });
  } catch (error) {
    console.error("Error getting model statuses:", error);
    return NextResponse.json(
      { error: "Failed to get model statuses" },
      { status: 500 }
    );
  }
}
