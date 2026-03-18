#!/bin/bash

# ============================================================
#  KBP eCommerce - Deployment Script
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
success() { echo -e "${GREEN}✔  $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $1${NC}"; }
error()   { echo -e "${RED}✘  $1${NC}"; exit 1; }

echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   KBP eCommerce - Deployment Process                ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""

# ── Pre-flight checks ────────────────────────────────────────
log "Running pre-flight checks..."

command -v bun      >/dev/null 2>&1 || error "bun is not installed. Install from https://bun.sh"
command -v dotnet   >/dev/null 2>&1 || error "dotnet is not installed. Install from https://dotnet.microsoft.com"
command -v dotnet   >/dev/null 2>&1 && dotnet ef --version >/dev/null 2>&1 || warn "dotnet-ef tool not found. Install with: dotnet tool install --global dotnet-ef"

[ -d "$FRONTEND_DIR" ] || error "Frontend directory not found: $FRONTEND_DIR"
[ -d "$BACKEND_DIR"  ] || error "Backend directory not found: $BACKEND_DIR"

if [ ! -f "$BACKEND_DIR/.env" ]; then
    warn "Backend .env file not found at $BACKEND_DIR/.env"
    warn "Make sure environment variables (DB_CONNECTION, JWT_SECRET, etc.) are set."
else
    success "Backend .env file found."
fi

if [ ! -f "$FRONTEND_DIR/.env" ]; then
    warn "Frontend .env file not found at $FRONTEND_DIR/.env"
else
    success "Frontend .env file found."
fi

success "Pre-flight checks passed."
echo ""

# ── Step 1: Build Frontend ───────────────────────────────────
log "[1/4] Installing and building Frontend (Bun + Vite + React)..."
cd "$FRONTEND_DIR"

bun install --frozen-lockfile
success "Frontend dependencies installed."

bun run build
success "Frontend built successfully → $FRONTEND_OUT_DIR"
echo ""

# ── Step 2: Publish Backend ──────────────────────────────────
log "[2/4] Restoring and publishing Backend (ASP.NET Core)..."
cd "$BACKEND_DIR"

dotnet restore
success "NuGet packages restored."

rm -rf "$PUBLISH_DIR"
dotnet publish -c Release -o "$PUBLISH_DIR" --nologo
success "Backend published → $PUBLISH_DIR"
echo ""

# ── Step 3: Apply DB Migrations ──────────────────────────────
log "[3/4] Applying Entity Framework Core database migrations..."
cd "$BACKEND_DIR"

if command -v dotnet-ef >/dev/null 2>&1 || dotnet ef --version >/dev/null 2>&1; then
    dotnet ef database update
    success "Database migrations applied."
else
    warn "dotnet-ef not available — skipping migration step."
    warn "Run manually: cd backend && dotnet ef database update"
fi
echo ""

# ── Step 4: Restart Services ─────────────────────────────────
log "[4/4] Restarting services..."

# ── Option A: systemd (uncomment and adjust service names) ───
# if systemctl is-active --quiet ecommerce-api.service; then
#     sudo systemctl restart ecommerce-api.service
#     success "Backend service restarted (systemd)."
# else
#     warn "ecommerce-api.service is not running. Start it with: sudo systemctl start ecommerce-api.service"
# fi

# ── Option B: Copy frontend dist to Nginx web root ───────────
# NGINX_WEB_ROOT="/var/www/html"
# if [ -d "$NGINX_WEB_ROOT" ]; then
#     sudo cp -r "$FRONTEND_OUT_DIR/." "$NGINX_WEB_ROOT/"
#     sudo systemctl reload nginx
#     success "Frontend deployed to Nginx web root and reloaded."
# fi

# ── Option C: Run backend directly (dev / simple server) ─────
warn "No service manager configured. To run manually:"
echo -e "  Backend  → ${CYAN}cd $PUBLISH_DIR && dotnet backend.dll${NC}"
echo -e "  Frontend → ${CYAN}cd $FRONTEND_DIR && bun run preview${NC}"
echo -e "  (or serve $FRONTEND_OUT_DIR with Nginx/Apache)"
echo ""

# ── Done ─────────────────────────────────────────────────────
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}   Deployment completed successfully! 🚀              ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo ""
echo -e "  Frontend build : ${CYAN}$FRONTEND_OUT_DIR${NC}"
echo -e "  Backend build  : ${CYAN}$PUBLISH_DIR${NC}"
echo ""
