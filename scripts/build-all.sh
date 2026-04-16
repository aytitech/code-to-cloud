#!/usr/bin/env bash
set -euo pipefail

# Build all CloudMart service images locally.
# Run this from the repo root.
# Each image is tagged as <service>:dev

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

echo "Building all CloudMart images..."
echo ""

for svc in "${SERVICES[@]}"; do
  echo "--- $svc ---"
  docker build -t "$svc:dev" "app/$svc"
  echo ""
done

echo "Done. Images built:"
for svc in "${SERVICES[@]}"; do
  echo "  $svc:dev"
done
