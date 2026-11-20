#!/usr/bin/env bash
# Installe un runner GitHub Actions auto-hébergé sur la VM Proxmox (Debian/Ubuntu).
# Usage : sudo ./install-runner.sh <TOKEN>
# Le token se récupère dans GitHub : Settings > Actions > Runners > New self-hosted runner
set -euo pipefail

REPO_URL="https://github.com/Diduck/brun_nul"
TOKEN="${1:?Usage : sudo $0 <TOKEN>}"
RUNNER_USER="github-runner"
RUNNER_DIR="/opt/actions-runner"
LABELS="proxmox"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lance ce script avec sudo." >&2
  exit 1
fi

for cmd in docker curl tar; do
  if ! command -v "$cmd" > /dev/null; then
    echo "Commande manquante : $cmd (installe-la avant de continuer)." >&2
    exit 1
  fi
done

# Utilisateur dédié, autorisé à utiliser Docker
id "$RUNNER_USER" &> /dev/null || useradd -m -s /bin/bash "$RUNNER_USER"
usermod -aG docker "$RUNNER_USER"

case "$(uname -m)" in
  x86_64)  ARCH="x64" ;;
  aarch64) ARCH="arm64" ;;
  *) echo "Architecture non supportée : $(uname -m)" >&2; exit 1 ;;
esac

# Dernière version du runner
VERSION="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest \
  | grep -o '"tag_name": *"v[^"]*"' | sed 's/.*"v\([^"]*\)"/\1/')"
echo "Installation du runner v$VERSION ($ARCH)..."

mkdir -p "$RUNNER_DIR"
chown "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"
cd "$RUNNER_DIR"

sudo -u "$RUNNER_USER" curl -fsSL -o runner.tar.gz \
  "https://github.com/actions/runner/releases/download/v$VERSION/actions-runner-linux-$ARCH-$VERSION.tar.gz"
sudo -u "$RUNNER_USER" tar xzf runner.tar.gz
rm runner.tar.gz

./bin/installdependencies.sh

sudo -u "$RUNNER_USER" ./config.sh \
  --url "$REPO_URL" \
  --token "$TOKEN" \
  --name "$(hostname)" \
  --labels "$LABELS" \
  --unattended \
  --replace

# Service systemd : le runner redémarre avec la VM
./svc.sh install "$RUNNER_USER"
./svc.sh start

echo "Runner installé et démarré. Il doit apparaître en vert dans Settings > Actions > Runners."
