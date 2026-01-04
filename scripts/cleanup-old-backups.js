/**
 * Cleanup Old Database Backups from R2
 *
 * This script removes old backups from R2, keeping only the most recent N backups.
 *
 * Usage: node scripts/cleanup-old-backups.js <retain-count>
 *
 * Required Environment Variables:
 *   CLOUDFARE_ACCESS_KEY  - Cloudflare R2 access key ID
 *   CLOUDFARE_SECRET_KEY  - Cloudflare R2 secret access key
 *   R2_ENDPOINT           - Cloudflare R2 endpoint URL
 *   R2_BACKUP_BUCKET      - R2 bucket name (e.g., "db-backups")
 */

const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

async function cleanupOldBackups() {
  const retainCount = parseInt(process.argv[2] || "4", 10);

  console.log(`🧹 Cleaning up old backups (keeping last ${retainCount})...`);

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

  try {
    // List all backup files
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BACKUP_BUCKET,
        Prefix: "backups/backup-",
      })
    );

    const backups = listResponse.Contents || [];

    if (backups.length === 0) {
      console.log("📂 No backups found in bucket");
      return;
    }

    // Sort by last modified date (newest first)
    backups.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

    console.log(`📊 Found ${backups.length} backup(s) in R2`);

    if (backups.length <= retainCount) {
      console.log(
        `✅ No cleanup needed (${backups.length}/${retainCount} slots used)`
      );
      return;
    }

    // Delete old backups
    const toDelete = backups.slice(retainCount);
    console.log(`🗑️ Deleting ${toDelete.length} old backup(s)...`);

    for (const backup of toDelete) {
      console.log(`   Deleting: ${backup.Key}`);
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BACKUP_BUCKET,
          Key: backup.Key,
        })
      );
    }

    console.log(
      `✅ Cleanup complete! Removed ${toDelete.length} old backup(s)`
    );
  } catch (error) {
    console.error(`❌ Cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

cleanupOldBackups();
