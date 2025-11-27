import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFARE_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFARE_SECRET_KEY!,
  },
});
const bucket = process.env.R2_BUCKET!;
type Req = { files: { name: string; type?: string }[]; prefix?: string };
export async function POST(req: NextRequest) {
  try {
    const { files, prefix } = (await req.json()) as Req;
    if (!files?.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    const nowPrefix = prefix ?? new Date().toISOString().slice(0, 10);
    const results = await Promise.all(
      files.map(async (f) => {
        const key = `${nowPrefix}/${randomUUID()}-${encodeURIComponent(f.name)}`;
        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: f.type || "application/octet-stream",
          CacheControl: "public, max-age=31536000, immutable",
        });
        const uploadUrl = await getSignedUrl(S3, cmd, { expiresIn: 60 * 5 });
        const publicUrl = `${process.env.CLOUDFARE_IMAGE_URL}/${key}`;
        return {
          key,
          uploadUrl,
          publicUrl,
          contentType: f.type || "application/octet-stream",
        };
      })
    );
    return NextResponse.json({ uploads: results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to presign R2 URLs", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}