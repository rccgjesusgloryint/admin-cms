import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFARE_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFARE_SECRET_KEY!,
  },
  // Disable automatic checksum calculation for presigned URLs.
  // SDK v3.598+ defaults to "WHEN_SUPPORTED" which bakes a CRC32 checksum
  // (of an empty body) into presigned URLs. When the client uploads the actual
  // file, R2 sees a checksum mismatch and may store a zero-byte object.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const bucket = process.env.R2_BUCKET!;

type Req = { files: { name: string; type?: string }[]; prefix?: string };

const generateKey = () => crypto.randomUUID(); // ✅ Web Crypto, available on Edge

const randomUUID = () => crypto.randomUUID(); // ✅ Web Crypto, available on Edge

export async function POST(req: NextRequest) {
  try {
    const { files, prefix } = (await req.json()) as Req;
    if (!files?.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    const nowPrefix = prefix ?? new Date().toISOString().slice(0, 10);
    const results = await Promise.all(
      files.map(async (f) => {
        const key = `${nowPrefix}/${randomUUID()}-${f.name}`;
        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: f.type || "application/octet-stream",
        });
        // Note: CacheControl was removed from the command because it becomes a
        // signed header in the presigned URL. Clients that don't send the exact
        // Cache-Control value get a 403 SignatureDoesNotMatch error from R2.
        // Set cache rules via Cloudflare R2 bucket settings or Transform Rules instead.
        const uploadUrl = await getSignedUrl(S3, cmd, { expiresIn: 60 * 5 });
        // Encode each path segment for the public URL (preserves '/' separators)
        const publicUrl = `${process.env.CLOUDFARE_IMAGE_URL}/${key.split("/").map(encodeURIComponent).join("/")}`;
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