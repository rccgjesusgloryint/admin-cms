import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentModelIndex, getModelStatuses, AI_MODELS } from "@/lib/ai-config";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { modelIndex, modelName } = body;

    let targetIndex: number;

    if (typeof modelIndex === "number") {
      targetIndex = modelIndex;
    } else if (typeof modelName === "string") {
      targetIndex = AI_MODELS.indexOf(modelName as typeof AI_MODELS[number]);
      if (targetIndex === -1) {
        return NextResponse.json(
          { error: `Model not found: ${modelName}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Either modelIndex or modelName must be provided" },
        { status: 400 }
      );
    }

    if (targetIndex < 0 || targetIndex >= AI_MODELS.length) {
      return NextResponse.json(
        { error: `Invalid model index: ${targetIndex}` },
        { status: 400 }
      );
    }

    // Update database with manual model selection
    const selectedModel = AI_MODELS[targetIndex];
    try {
      await prisma.siteSettings.upsert({
        where: { id: 1 },
        update: {
          selectedModel,
          autoSelectModel: false,
        },
        create: {
          id: 1,
          selectedModel,
          autoSelectModel: false,
        },
      });
    } catch (error) {
      console.error("Error updating model preference:", error);
      // Continue even if DB update fails
    }

    // Return updated status
    const statusMap = getModelStatuses();
    const activeModelIndex = targetIndex;
    
    const models = AI_MODELS.map((modelName) => {
      const status = statusMap.get(modelName);
      const isActive = AI_MODELS.indexOf(modelName) === activeModelIndex;
      
      let statusString: "available" | "rate_limited" | "error" | "testing" = "available";
      if (status) {
        if (!status.available) {
          statusString = status.lastError?.toLowerCase().includes("rate limit") 
            ? "rate_limited" 
            : "error";
        }
      }

      return {
        name: modelName,
        status: statusString,
        isActive,
        lastError: status?.lastError,
        lastErrorTime: status?.lastFailure?.toISOString(),
        lastSuccessTime: status?.available && status?.lastChecked 
          ? status.lastChecked.toISOString() 
          : undefined,
        retryAfter: statusString === "rate_limited" && status?.lastFailure
          ? new Date(status.lastFailure.getTime() + 60 * 1000).toISOString()
          : undefined,
      };
    });

    return NextResponse.json(
      {
        models,
        activeModelIndex,
        message: `Switched to model: ${selectedModel}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error switching model:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to switch model: ${errorMessage}` },
      { status: 500 }
    );
  }
}

