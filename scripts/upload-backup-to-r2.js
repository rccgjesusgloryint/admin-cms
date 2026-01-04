/**
 * Upload Database Backup to Cloudflare R2
 *
 * This script uploads a backup file to the db-backups R2 bucket.
 *
 * Usage: node scripts/upload-backup-to-r2.js <backup-file-path>
 *
 * Required Environment Variables:
 *   CLOUDFARE_ACCESS_KEY  - Cloudflare R2 access key ID
 *   CLOUDFARE_SECRET_KEY  - Cloudflare R2 secret access key
 *   R2_ENDPOINT           - Cloudflare R2 endpoint URL
 *   R2_BACKUP_BUCKET      - R2 bucket name (e.g., "db-backups")
 */

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

async function uploadBackup() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.error("❌ Error: No backup file specified");
    console.error("Usage: node upload-backup-to-r2.js <backup-file-path>");
    process.exit(1);
  }

  // Validate environment variables
  const required = [
    "CLOUDFARE_ACCESS_KEY",
    "CLOUDFARE_SECRET_KEY",
    "R2_ENDPOINT",
    "R2_BACKUP_BUCKET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Error: Missing environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  // Check file exists
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Error: Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  const {
    CLOUDFARE_ACCESS_KEY,
    CLOUDFARE_SECRET_KEY,
    R2_ENDPOINT,
    R2_BACKUP_BUCKET,
  } = process.env;

  // Initialize S3 client for R2
  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: CLOUDFARE_ACCESS_KEY,
      secretAccessKey: CLOUDFARE_SECRET_KEY,
    },
  });

  const fileName = path.basename(backupFile);
  const fileContent = fs.readFileSync(backupFile);
  const fileSize = fs.statSync(backupFile).size;

  console.log(`📤 Uploading backup to R2...`);
  console.log(`   File: ${fileName}`);
  console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Bucket: ${R2_BACKUP_BUCKET}`);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BACKUP_BUCKET,
        Key: `backups/${fileName}`,
        Body: fileContent,
        ContentType: "application/gzip",
        Metadata: {
          "backup-timestamp": new Date().toISOString(),
          "original-size": fileSize.toString(),
        },
      })
    );

    console.log(`✅ Backup uploaded successfully to R2!`);
    console.log(`   Path: s3://${R2_BACKUP_BUCKET}/backups/${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to upload backup: ${error.message}`);
    process.exit(1);
  }
}

uploadBackup();
