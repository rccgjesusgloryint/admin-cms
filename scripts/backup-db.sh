#!/bin/bash
# =============================================================================
# Supabase Database Backup Script
# =============================================================================
# This script creates a compressed backup of the PostgreSQL database using pg_dump.
# 
# Usage:
#   ./scripts/backup-db.sh                    # Full backup
#   ./scripts/backup-db.sh --schema-only      # Schema only (no data)
#   ./scripts/backup-db.sh --dry-run          # Show what would happen
#
# Environment Variables Required:
#   DIRECT_URL    - PostgreSQL connection string (direct, not pooled)
#
# Optional Environment Variables:
#   BACKUP_DIR    - Directory to store backups (default: ./backups)
#   BACKUP_RETAIN - Number of backups to keep (default: 4)
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETAIN="${BACKUP_RETAIN:-4}"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# Parse arguments
DRY_RUN=false
SCHEMA_ONLY=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --schema-only)
            SCHEMA_ONLY=true
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run       Show what would happen without making changes"
            echo "  --schema-only   Backup schema only (no data)"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
    esac
done

# Check for required environment variable
if [[ -z "${DIRECT_URL:-}" ]]; then
    log_error "DIRECT_URL environment variable is not set."
    log_error "Set it using: export DIRECT_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

# Check for pg_dump
if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump is not installed. Please install PostgreSQL client tools."
    log_error "  macOS:   brew install postgresql"
    log_error "  Ubuntu:  sudo apt-get install postgresql-client"
    exit 1
fi

# Create backup directory if it doesn't exist
if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY RUN] Would create directory: ${BACKUP_DIR}"
else
    mkdir -p "${BACKUP_DIR}"
fi

# Build pg_dump command
PG_DUMP_CMD="pg_dump"
PG_DUMP_OPTS="--no-owner --no-acl --clean --if-exists"

if [[ "$SCHEMA_ONLY" == true ]]; then
    PG_DUMP_OPTS="${PG_DUMP_OPTS} --schema-only"
    BACKUP_FILE="${BACKUP_DIR}/backup-schema-${TIMESTAMP}.sql.gz"
fi

log_info "Starting database backup..."
log_info "Timestamp: ${TIMESTAMP}"
log_info "Output file: ${BACKUP_FILE}"
log_info "Schema only: ${SCHEMA_ONLY}"

if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY RUN] Would execute: pg_dump <connection_string> ${PG_DUMP_OPTS} | gzip > ${BACKUP_FILE}"
    log_info "[DRY RUN] Backup would be saved to: ${BACKUP_FILE}"
    exit 0
fi

# Perform the backup
START_TIME=$(date +%s)

if pg_dump "${DIRECT_URL}" ${PG_DUMP_OPTS} 2>/dev/null | gzip > "${BACKUP_FILE}"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    
    log_success "Backup completed successfully!"
    log_info "Duration: ${DURATION} seconds"
    log_info "File size: ${FILE_SIZE}"
    log_info "Location: ${BACKUP_FILE}"
    
    # Validate backup file
    if gzip -t "${BACKUP_FILE}" 2>/dev/null; then
        log_success "Backup file integrity verified (gzip check passed)"
    else
        log_error "Backup file may be corrupted!"
        exit 1
    fi
    
    # Check minimum file size (should be at least a few KB for a real database)
    MIN_SIZE=100  # bytes
    ACTUAL_SIZE=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat --printf="%s" "${BACKUP_FILE}" 2>/dev/null)
    if [[ "${ACTUAL_SIZE}" -lt "${MIN_SIZE}" ]]; then
        log_warning "Backup file is very small (${ACTUAL_SIZE} bytes). This might indicate an empty or failed backup."
    fi
else
    log_error "Backup failed!"
    rm -f "${BACKUP_FILE}"  # Clean up partial file
    exit 1
fi

# Cleanup old backups (keep last N backups)
log_info "Cleaning up old backups (keeping last ${BACKUP_RETAIN})..."
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/backup-*.sql.gz 2>/dev/null | wc -l | tr -d ' ')

if [[ "${BACKUP_COUNT}" -gt "${BACKUP_RETAIN}" ]]; then
    DELETE_COUNT=$((BACKUP_COUNT - BACKUP_RETAIN))
    log_info "Removing ${DELETE_COUNT} old backup(s)..."
    ls -1t "${BACKUP_DIR}"/backup-*.sql.gz | tail -n "${DELETE_COUNT}" | xargs rm -f
    log_success "Old backups cleaned up"
else
    log_info "No old backups to clean up (${BACKUP_COUNT}/${BACKUP_RETAIN})"
fi

# Output backup info in JSON format for CI/CD integration
echo ""
echo "=== BACKUP METADATA (JSON) ==="
cat <<EOF
{
  "status": "success",
  "timestamp": "${TIMESTAMP}",
  "file": "${BACKUP_FILE}",
  "size_bytes": ${ACTUAL_SIZE},
  "duration_seconds": ${DURATION},
  "schema_only": ${SCHEMA_ONLY}
}
EOF

exit 0
