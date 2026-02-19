import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { testModel, AI_MODELS } from "@/lib/ai-config";
import { isAdmin } from "@/lib/queries";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { model } = await req.json();

    if (!model) {
      return NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      );
    }

    // Validate model is in the list
    if (!AI_MODELS.includes(model as any)) {
      return NextResponse.json(
        { error: "Invalid model name" },
        { status: 400 }
      );
    }

    const result = await testModel(model);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error testing model:", error);
    return NextResponse.json(
      { error: "Failed to test model", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}



