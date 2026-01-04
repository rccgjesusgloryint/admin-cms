# Database Backup System

This project includes an automated backup system for the Supabase PostgreSQL database.

## How It Works

- **Automatic backups** run every 7 days via GitHub Actions
- Backups are compressed with gzip and uploaded to Cloudflare R2
- Old backups are automatically cleaned up (keeps last 4 = 28 days)
- Manual backup trigger available via GitHub Actions UI

## Quick Start

### Manual Backup (Local)

```bash
# Set the direct database URL
export DIRECT_URL="postgresql://..."

# Run backup
./scripts/backup-db.sh

# Dry run (see what would happen)
./scripts/backup-db.sh --dry-run
```

### Restore from Backup

```bash
# List available backups
./scripts/restore-db.sh

# Restore specific backup
./scripts/restore-db.sh ./backups/backup-2026-01-04-120000.sql.gz

# Dry run
./scripts/restore-db.sh ./backups/backup-2026-01-04-120000.sql.gz --dry-run
```

## GitHub Actions Setup

### Required Secrets

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `DIRECT_URL`           | Supabase direct PostgreSQL connection string                        |
| `CLOUDFARE_ACCESS_KEY` | Cloudflare R2 access key (use existing)                             |
| `CLOUDFARE_SECRET_KEY` | Cloudflare R2 secret key (use existing)                             |
| `R2_ENDPOINT`          | R2 endpoint (e.g., `https://<account_id>.r2.cloudflarestorage.com`) |
| `R2_BACKUP_BUCKET`     | R2 bucket name (e.g., `db-backups`)                                 |

### Manual Trigger

1. Go to GitHub → Actions → "Database Backup"
2. Click "Run workflow"
3. Optionally select "Schema only" for schema-only backup

## Backup Files

- **Location (local)**: `./backups/backup-YYYY-MM-DD-HHMMSS.sql.gz`
- **Location (R2)**: `db-backups/backups/backup-YYYY-MM-DD-HHMMSS.sql.gz`
- **Retention**: Last 4 backups (28 days)

## Troubleshooting

### pg_dump not found

```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql-client
```

### Connection refused

Ensure you're using the **direct** connection URL, not the pooled connection.

### Permission denied on scripts

```bash
chmod +x scripts/backup-db.sh scripts/restore-db.sh
```
