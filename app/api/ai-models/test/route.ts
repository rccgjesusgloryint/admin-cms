import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  testModel,
  getModelStatuses,
  getCurrentModelIndex,
  AI_MODELS,
} from "@/lib/ai-config";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { modelName } = body;

    if (!modelName || typeof modelName !== "string") {
      return NextResponse.json(
        { error: "modelName is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate model exists
    if (!AI_MODELS.includes(modelName as (typeof AI_MODELS)[number])) {
      return NextResponse.json(
        { error: `Model not found: ${modelName}` },
        { status: 400 }
      );
    }

    const result = await testModel(modelName);

    // Return updated status
    const statusMap = getModelStatuses();
    const status = statusMap.get(modelName);
    const activeModelIndex = getCurrentModelIndex();
    const isActive = AI_MODELS.indexOf(modelName as any) === activeModelIndex;

    // After testing, hasBeenTested should be true
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
        statusString = status.lastError?.toLowerCase().includes("rate limit")
          ? "rate_limited"
          : "error";
      }
    }

    return NextResponse.json(
      {
        success: result.success,
        error: result.error,
        model: {
          name: modelName,
          status: statusString,
          isActive,
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
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error testing model:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to test model: ${errorMessage}` },
      { status: 500 }
    );
  }
}
