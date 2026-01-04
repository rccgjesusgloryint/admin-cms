#!/bin/bash
# =============================================================================
# Supabase Database Restore Script
# =============================================================================
# This script restores the PostgreSQL database from a backup file.
#
# Usage:
#   ./scripts/restore-db.sh                           # List available backups
#   ./scripts/restore-db.sh <backup-file>             # Restore specific backup
#   ./scripts/restore-db.sh <backup-file> --dry-run   # Show what would happen
#
# Environment Variables Required:
#   DIRECT_URL    - PostgreSQL connection string (direct, not pooled)
#
# WARNING: This will overwrite the existing database!
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

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
BACKUP_FILE=""
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        -h|--help)
            echo "Usage: $0 [BACKUP_FILE] [OPTIONS]"
            echo ""
            echo "Arguments:"
            echo "  BACKUP_FILE     Path to backup file (optional, lists backups if not provided)"
            echo ""
            echo "Options:"
            echo "  --dry-run       Show what would happen without making changes"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # List available backups"
            echo "  $0 ./backups/backup-2026-01-04.sql.gz  # Restore from specific file"
            exit 0
            ;;
        *)
            if [[ -z "$BACKUP_FILE" && ! "$arg" =~ ^-- ]]; then
                BACKUP_FILE="$arg"
            fi
            ;;
    esac
done

# If no backup file specified, list available backups
if [[ -z "$BACKUP_FILE" ]]; then
    log_info "Available backups in ${BACKUP_DIR}:"
    echo ""
    
    if [[ -d "$BACKUP_DIR" ]] && ls -1 "${BACKUP_DIR}"/backup-*.sql.gz &>/dev/null; then
        echo "Date                 Size     File"
        echo "-------------------  -------  ----------------------------------------"
        for file in $(ls -1t "${BACKUP_DIR}"/backup-*.sql.gz 2>/dev/null); do
            SIZE=$(du -h "$file" | cut -f1)
            BASENAME=$(basename "$file")
            # Extract date from filename
            DATE=$(echo "$BASENAME" | sed -E 's/backup-([0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}).*/\1/')
            printf "%-19s  %-7s  %s\n" "$DATE" "$SIZE" "$file"
        done
        echo ""
        echo "To restore, run: $0 <path-to-backup-file>"
    else
        log_warning "No backups found in ${BACKUP_DIR}"
        log_info "Run ./scripts/backup-db.sh to create a backup first."
    fi
    exit 0
fi

# Check for required environment variable
if [[ -z "${DIRECT_URL:-}" ]]; then
    log_error "DIRECT_URL environment variable is not set."
    log_error "Set it using: export DIRECT_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

# Check for psql
if ! command -v psql &> /dev/null; then
    log_error "psql is not installed. Please install PostgreSQL client tools."
    log_error "  macOS:   brew install postgresql"
    log_error "  Ubuntu:  sudo apt-get install postgresql-client"
    exit 1
fi

# Validate backup file exists
if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Validate backup file integrity
log_info "Validating backup file integrity..."
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_error "Backup file is corrupted or not a valid gzip file."
    exit 1
fi
log_success "Backup file integrity verified"

# Extract database info for confirmation
log_info "Backup file: $BACKUP_FILE"
log_info "File size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Safety confirmation
if [[ "$DRY_RUN" == true ]]; then
    log_info "[DRY RUN] Would restore database from: $BACKUP_FILE"
    log_info "[DRY RUN] Command: gunzip -c ${BACKUP_FILE} | psql <connection_string>"
    exit 0
fi

echo ""
log_warning "==================== WARNING ===================="
log_warning "This will OVERWRITE the current database!"
log_warning "Database: Supabase (from DIRECT_URL)"
log_warning "Backup: $BACKUP_FILE"
log_warning "================================================"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    log_info "Restore cancelled."
    exit 0
fi

# Perform the restore
log_info "Starting database restore..."
START_TIME=$(date +%s)

if gunzip -c "$BACKUP_FILE" | psql "${DIRECT_URL}" 2>&1; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_success "Database restored successfully!"
    log_info "Duration: ${DURATION} seconds"
else
    log_error "Restore failed!"
    exit 1
fi

exit 0
