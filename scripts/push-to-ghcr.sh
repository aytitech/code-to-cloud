#!/usr/bin/env bash
set -euo pipefail

# Tag and push all CloudMart images to ghcr.io.
# Run this from the repo root after building with build-all.sh.
#
# Usage:
#   export GITHUB_USER=your-github-username
#   ./scripts/push-to-ghcr.sh
#
#   OR pass username as argument:
#   ./scripts/push-to-ghcr.sh your-github-username

GITHUB_USER="${1:-${GITHUB_USER:-}}"

if [[ -z "$GITHUB_USER" ]]; then
  echo "Error: GitHub username required."
  echo ""
  echo "Usage:"
  echo "  export GITHUB_USER=your-github-username && ./scripts/push-to-ghcr.sh"
  echo "  ./scripts/push-to-ghcr.sh your-github-username"
  exit 1
fi

SHA=$(git rev-parse --short HEAD)

SERVICES=(
  user-service
  product-service
  search-service
  order-service
  review-service
  cart-service
  notification-service
  storefront
)

echo "Pushing all CloudMart images to ghcr.io/$GITHUB_USER"
echo "SHA: $SHA"
echo ""

for svc in "${SERVICES[@]}"; do
  echo "--- $svc ---"
  docker tag "$svc:dev" "ghcr.io/$GITHUB_USER/$svc:$SHA"
  docker tag "$svc:dev" "ghcr.io/$GITHUB_USER/$svc:latest"
  docker push "ghcr.io/$GITHUB_USER/$svc:$SHA"
  docker push "ghcr.io/$GITHUB_USER/$svc:latest"
  echo ""
done

echo "Done. All images pushed as :$SHA and :latest"
