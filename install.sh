#!/bin/bash
set -e

echo "=== Virtual Office Buddy One-click Installer ==="
echo ""

if [ ! -d "virtual-office-buddy" ]; then
  git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
fi
cd virtual-office-buddy

if ! command -v node &>/dev/null; then
  echo "Node.js 22 is required. Install Node.js first, then rerun this script."
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "npm is required. Install npm first, then rerun this script."
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.local.example .env
  echo ""
  echo "Edit .env before continuing:"
  echo "   - OPENROUTER_API_KEY or OPENAI_API_KEY for standalone chat"
  echo "   - VITE_HERMES_LOCAL_URL if using Hermes mode"
  echo "   - PRISM_BROWSER_PROXY_TOKEN / VITE_PRISM_PROXY_AUTH_TOKEN for private browser-direct proxy auth"
  echo ""
  read -rp "Press Enter after editing .env..."
fi

echo ""
echo "Installing dependencies..."
npm ci

echo ""
echo "Building..."
npm run build

if command -v systemctl &>/dev/null; then
  INSTALL_DIR="$(pwd)"
  CURRENT_USER="$(whoami)"
  sed \
    -e "s|User=root|User=$CURRENT_USER|" \
    -e "s|WorkingDirectory=/root/virtual-office-buddy|WorkingDirectory=$INSTALL_DIR|" \
    -e "s|EnvironmentFile=-/root/virtual-office-buddy/.env|EnvironmentFile=-$INSTALL_DIR/.env|" \
    scripts/virtual-office-buddy.service | sudo tee /etc/systemd/system/virtual-office-buddy.service >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable --now virtual-office-buddy
  echo ""
  echo "Installed! Virtual Office Buddy is running as a systemd service"
  echo "   http://localhost:3000"
  echo ""
  echo "   Logs: sudo journalctl -u virtual-office-buddy -f"
else
  echo ""
  echo "Build complete. Run:"
  echo "   npm run preview -- --port 3000 --host 0.0.0.0"
  echo "   then open http://localhost:3000"
fi
