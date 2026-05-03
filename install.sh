#!/bin/bash
set -e

echo "=== Virtual Office Buddy One-click Installer ==="
echo ""

# 1. Clone
if [ ! -d "virtual-office-buddy" ]; then
  git clone https://github.com/sorawittj-hue/virtual-office-buddy.git
fi
cd virtual-office-buddy

# 2. Install Bun if missing
if ! command -v bun &>/dev/null; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# 3. Setup .env
if [ ! -f ".env" ]; then
  cp .env.local.example .env
  echo ""
  echo "✏️  แก้ไข .env ก่อนดำเนินการต่อ:"
  echo "   - VITE_DEFAULT_API_URL  (URL ของ Hermes Agent)"
  echo "   - VITE_DEFAULT_API_KEY  (ถ้ามี API key)"
  echo ""
  read -rp "กด Enter เมื่อแก้ไข .env เสร็จแล้ว..."
fi

# 4. Install dependencies
echo ""
echo "Installing dependencies..."
bun install

# 5. Build
echo ""
echo "Building..."
bun run build

# 6. Install systemd service (Linux only)
if command -v systemctl &>/dev/null; then
  # Patch service file paths to match current user + directory
  INSTALL_DIR="$(pwd)"
  CURRENT_USER="$(whoami)"
  sed \
    -e "s|User=root|User=$CURRENT_USER|" \
    -e "s|WorkingDirectory=/root/virtual-office-buddy|WorkingDirectory=$INSTALL_DIR|" \
    -e "s|EnvironmentFile=-/root/virtual-office-buddy/.env|EnvironmentFile=-$INSTALL_DIR/.env|" \
    -e "s|ExecStart=/root/.bun/bin/bun|ExecStart=$(which bun)|" \
    scripts/prism.service | sudo tee /etc/systemd/system/prism-dashboard.service > /dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable --now prism-dashboard
  echo ""
  echo "Installed! Virtual Office Buddy is running as a systemd service"
  echo "   http://localhost:3000"
  echo ""
  echo "   ดู logs: sudo journalctl -u prism-dashboard -f"
else
  echo ""
  echo "✅ Build เสร็จแล้ว! รันด้วย:"
  echo "   bun run preview --port 3000 --host 0.0.0.0"
  echo "   แล้วเปิด http://localhost:3000"
fi
