import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

// Using Node.js runtime (default) as AWS SDK requires DOMParser for XML parsing

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFARE_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFARE_SECRET_KEY!,
  },
});

const bucket = process.env.R2_BUCKET!;
const publicUrl = process.env.CLOUDFARE_IMAGE_URL!;

// Allowed image extensions
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

function isImageKey(key: string): boolean {
  const lower = key.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const continuationToken =
      searchParams.get("continuationToken") ?? undefined;
    const maxKeys = parseInt(searchParams.get("maxKeys") ?? "50", 10);

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    });

    const response = await S3.send(command);

    // Filter to only image files and map to our response format
    const objects =
      response.Contents?.filter((obj) => obj.Key && isImageKey(obj.Key)).map(
        (obj) => ({
          key: obj.Key!,
          url: `${publicUrl}/${obj.Key}`,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString() ?? "",
        })
      ) ?? [];

    return NextResponse.json(
      {
        objects,
        continuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated ?? false,
        totalCount: objects.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("R2 list error:", err);
    return NextResponse.json(
      {
        error: "Failed to list R2 objects",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
