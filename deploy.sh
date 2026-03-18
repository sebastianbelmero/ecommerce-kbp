#!/bin/bash

# ============================================================
#  KBP eCommerce - Deployment Script
#  Builds frontend & backend into a single deployable unit.
#  The backend serves the frontend static files from wwwroot/.
#  Usage: chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -e  # Exit immediately on any error

# ── Configuration ────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
PUBLISH_DIR="$PROJECT_ROOT/publish"
FRONTEND_OUT_DIR="$FRONTEND_DIR/dist"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()     { echo -e "${CYAN}>>> $1${NC}"; }
success() { echo -e "${GREEN}[OK]  $1${NC}"; }
warn()    { echo -e "${YELLOW}[!]  $1${NC}"; }
error()   { echo -e "${RED}[X]  $1${NC}"; exit 1; }

echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   KBP eCommerce - Deployment Process                ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""

# ── Pre-flight checks ────────────────────────────────────────
log "Running pre-flight checks..."

command -v bun      >/dev/null 2>&1 || error "bun is not installed. Install from https://bun.sh"
command -v dotnet   >/dev/null 2>&1 || error "dotnet is not installed. Install from https://dotnet.microsoft.com"

[ -d "$FRONTEND_DIR" ] || error "Frontend directory not found: $FRONTEND_DIR"
[ -d "$BACKEND_DIR"  ] || error "Backend directory not found: $BACKEND_DIR"

if [ ! -f "$BACKEND_DIR/.env" ]; then
    warn "Backend .env file not found at $BACKEND_DIR/.env"
    warn "Make sure environment variables (DB_CONNECTION, JWT_SECRET, etc.) are set."
else
    success "Backend .env file found."
fi

success "Pre-flight checks passed."
echo ""

# ── Step 1: Build Frontend ───────────────────────────────────
log "[1/4] Installing and building Frontend (Bun + Vite + React)..."
cd "$FRONTEND_DIR"

bun install --frozen-lockfile
success "Frontend dependencies installed."

bun run build
success "Frontend built successfully -> $FRONTEND_OUT_DIR"
echo ""

# ── Step 2: Publish Backend ──────────────────────────────────
log "[2/4] Restoring and publishing Backend (ASP.NET Core)..."
cd "$BACKEND_DIR"

dotnet restore
success "NuGet packages restored."

rm -rf "$PUBLISH_DIR"
dotnet publish -c Release -o "$PUBLISH_DIR" --nologo
success "Backend published -> $PUBLISH_DIR"
echo ""

# ── Step 3: Copy Frontend into Backend wwwroot ───────────────
log "[3/4] Copying frontend build into backend wwwroot..."

# Create wwwroot inside the publish directory and copy frontend dist into it
mkdir -p "$PUBLISH_DIR/wwwroot"
cp -r "$FRONTEND_OUT_DIR/." "$PUBLISH_DIR/wwwroot/"
success "Frontend files copied to $PUBLISH_DIR/wwwroot/"
echo ""

# Also copy .env to publish directory so the backend can read it
if [ -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env" "$PUBLISH_DIR/.env"
    success "Backend .env copied to publish directory."
fi
echo ""

# ── Step 4: Apply DB Migrations ──────────────────────────────
log "[4/4] Applying Entity Framework Core database migrations..."
cd "$BACKEND_DIR"

if command -v dotnet-ef >/dev/null 2>&1 || dotnet ef --version >/dev/null 2>&1; then
    dotnet ef database update
    success "Database migrations applied."
else
    warn "dotnet-ef not available -- skipping migration step."
    warn "Migrations will be applied automatically on first backend startup."
fi
echo ""

# ── Done ─────────────────────────────────────────────────────
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}   Deployment completed successfully!                 ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo ""
echo -e "  Published to : ${CYAN}$PUBLISH_DIR${NC}"
echo -e "  Frontend     : ${CYAN}$PUBLISH_DIR/wwwroot/${NC}"
echo -e "  Backend DLL  : ${CYAN}$PUBLISH_DIR/backend.dll${NC}"
echo ""
echo -e "  ${YELLOW}To run the application (single process):${NC}"
echo -e "  ${CYAN}cd $PUBLISH_DIR && dotnet backend.dll${NC}"
echo ""
echo -e "  The backend will serve both the API and the frontend."
echo -e "  Open ${CYAN}http://localhost:5000${NC} in your browser."
echo ""
