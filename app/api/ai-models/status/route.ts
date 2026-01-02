import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getModelStatuses,
  getCurrentModelIndex,
  AI_MODELS,
} from "@/lib/ai-config";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const statusMap = getModelStatuses();
    const activeModelIndex = getCurrentModelIndex();

    // Convert Map to array format for API response
    const models = AI_MODELS.map((modelName) => {
      const status = statusMap.get(modelName);
      const isActive = AI_MODELS.indexOf(modelName) === activeModelIndex;

      // Determine status string based on whether model has been tested
      let statusString:
        | "available"
        | "rate_limited"
        | "error"
        | "testing"
        | "unknown" = "unknown";
      if (status?.hasBeenTested) {
        if (status.available) {
          statusString = "available";
        } else {
          // Check if it's rate limited based on error message
          statusString = status.lastError?.toLowerCase().includes("rate limit")
            ? "rate_limited"
            : "error";
        }
      }

      return {
        name: modelName,
        status: statusString,
        isActive,
        hasBeenTested: status?.hasBeenTested ?? false,
        lastError: status?.lastError,
        lastErrorTime: status?.lastFailure?.toISOString(),
        lastSuccessTime:
          status?.available && status?.lastChecked
            ? status.lastChecked.toISOString()
            : undefined,
        retryAfter:
          statusString === "rate_limited" && status?.lastFailure
            ? new Date(status.lastFailure.getTime() + 60 * 1000).toISOString()
            : undefined,
      };
    });

    return NextResponse.json(
      {
        models,
        activeModelIndex,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching model statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch model statuses" },
      { status: 500 }
    );
  }
}
