#!/usr/bin/env bash
set -euo pipefail

# Build and push all StackShop images to ghcr.io using Docker buildx.
# Produces multi-platform images (linux/amd64 + linux/arm64) and pushes directly.
# Run this from the repo root.
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

# Ensure a multi-platform builder is active
if ! docker buildx inspect multiplatform &>/dev/null; then
  docker buildx create --name multiplatform --use
else
  docker buildx use multiplatform
fi

echo "Building and pushing all StackShop images to ghcr.io/$GITHUB_USER"
echo "Platforms: linux/amd64, linux/arm64"
echo "SHA: $SHA"
echo ""

for svc in "${SERVICES[@]}"; do
  echo "--- $svc ---"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "ghcr.io/$GITHUB_USER/$svc:$SHA" \
    --tag "ghcr.io/$GITHUB_USER/$svc:latest" \
    --push \
    "./app/$svc"
  echo ""
done

echo "Done. All images built and pushed as :$SHA and :latest"
