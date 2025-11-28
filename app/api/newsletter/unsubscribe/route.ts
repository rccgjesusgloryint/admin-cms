import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteNewsletterEmail } from "@/lib/queries";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await deleteNewsletterEmail(email);

    if (result.status === 200) {
      return NextResponse.json(
        { message: result.message },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: result.status }
      );
    }
  } catch (error) {
    console.error("Error removing subscriber:", error);
    return NextResponse.json(
      { error: "Failed to remove subscriber" },
      { status: 500 }
    );
  }
}

