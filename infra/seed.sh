#!/bin/bash
# StackShop seed script - populates the app with realistic demo data
# Run after `docker compose up --build` when all services are healthy

set -euo pipefail

USER_SVC="http://localhost:8001/api/users"
PRODUCT_SVC="http://localhost:8002/api/products"
ORDER_SVC="http://localhost:8003/api/orders"
REVIEW_SVC="http://localhost:8006/api/products"

# ── Helpers ────────────────────────────────────────────────────────────────────

info()  { echo "[INFO]  $*"; }
ok()    { echo "[OK]    $*"; }
err()   { echo "[ERROR] $*" >&2; exit 1; }

post() {
  local url="$1" data="$2" token="${3:-}"
  local args=(-s -X POST "$url" -H "Content-Type: application/json" -d "$data")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  curl "${args[@]}"
}

wait_for() {
  local url="$1" name="$2"
  info "Waiting for $name..."
  for i in $(seq 1 30); do
    if curl -sf "$url" > /dev/null 2>&1; then
      ok "$name is up"
      return
    fi
    sleep 2
  done
  err "$name did not become ready in time"
}

# ── Wait for services ──────────────────────────────────────────────────────────

wait_for "http://localhost:8001/health" "user-service"
wait_for "http://localhost:8002/health" "product-service"
wait_for "http://localhost:8003/health" "order-service"
wait_for "http://localhost:8006/health" "review-service"

# ── Register users ─────────────────────────────────────────────────────────────

info "Creating users..."

TOKEN_ALICE=$(post "$USER_SVC/register" '{"email":"alice@example.com","password":"password123","name":"Alice Chen"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
if [[ -z "$TOKEN_ALICE" ]]; then
  TOKEN_ALICE=$(post "$USER_SVC/login" '{"email":"alice@example.com","password":"password123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
fi

TOKEN_BOB=$(post "$USER_SVC/register" '{"email":"bob@example.com","password":"password123","name":"Bob Martinez"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
if [[ -z "$TOKEN_BOB" ]]; then
  TOKEN_BOB=$(post "$USER_SVC/login" '{"email":"bob@example.com","password":"password123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
fi

TOKEN_CAROL=$(post "$USER_SVC/register" '{"email":"carol@example.com","password":"password123","name":"Carol Kim"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
if [[ -z "$TOKEN_CAROL" ]]; then
  TOKEN_CAROL=$(post "$USER_SVC/login" '{"email":"carol@example.com","password":"password123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
fi

ok "Users ready"

# ── Create products ────────────────────────────────────────────────────────────

info "Creating products..."

create_product() {
  local token="$1" data="$2"
  post "$PRODUCT_SVC" "$data" "$token" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))"
}

P1=$(create_product "$TOKEN_ALICE" '{"name":"Wireless Noise-Cancelling Headphones","description":"Premium over-ear headphones with 30h battery and ANC technology.","price":249.99,"stock":45,"category":"Electronics","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones_with_Carry_Case.jpg/500px-Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones_with_Carry_Case.jpg"}')
P2=$(create_product "$TOKEN_ALICE" '{"name":"Mechanical Keyboard","description":"Compact TKL keyboard with tactile brown switches and RGB backlight.","price":129.99,"stock":60,"category":"Electronics","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Backlit_keyboard.jpg/500px-Backlit_keyboard.jpg"}')
P3=$(create_product "$TOKEN_ALICE" '{"name":"Ergonomic Office Chair","description":"Lumbar support, adjustable armrests, breathable mesh back.","price":399.00,"stock":20,"category":"Furniture","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Buerostuhl_%28fcm%29.jpg/500px-Buerostuhl_%28fcm%29.jpg"}')
P4=$(create_product "$TOKEN_BOB" '{"name":"Stainless Steel Water Bottle","description":"1L insulated bottle, keeps cold 24h and hot 12h.","price":34.95,"stock":120,"category":"Outdoors","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9d/Multiple_reusable_water_bottles.jpg/500px-Multiple_reusable_water_bottles.jpg"}')
P5=$(create_product "$TOKEN_BOB" '{"name":"Running Shoes","description":"Lightweight, breathable trail runners with cushioned sole.","price":89.99,"stock":80,"category":"Sports","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Asics_Gel-Cumulus_22.jpg/500px-Asics_Gel-Cumulus_22.jpg"}')
P6=$(create_product "$TOKEN_BOB" '{"name":"Python Programming Book","description":"Comprehensive guide covering Python 3, async, and data science.","price":49.99,"stock":200,"category":"Books","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Python_Programming_eBook_Reader.pdf/page1-500px-Python_Programming_eBook_Reader.pdf.jpg"}')
P7=$(create_product "$TOKEN_CAROL" '{"name":"Yoga Mat","description":"Non-slip 6mm mat with alignment lines and carrying strap.","price":29.99,"stock":95,"category":"Sports","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Yoga_mat_and_water_bottle_in_a_living_room.jpg/500px-Yoga_mat_and_water_bottle_in_a_living_room.jpg"}')
P8=$(create_product "$TOKEN_CAROL" '{"name":"Smart LED Desk Lamp","description":"Touch-dimmable lamp with USB-C charging port and color temperature control.","price":59.99,"stock":70,"category":"Electronics","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Battery_powered_LED_desk_lamp-7420.jpg/500px-Battery_powered_LED_desk_lamp-7420.jpg"}')
P9=$(create_product "$TOKEN_CAROL" '{"name":"Coffee Grinder","description":"Burr grinder with 15 grind settings, ideal for espresso to French press.","price":79.99,"stock":40,"category":"Kitchen","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Coffee_Grinder_Zassenhaus.jpg/500px-Coffee_Grinder_Zassenhaus.jpg"}')
P10=$(create_product "$TOKEN_ALICE" '{"name":"Portable Bluetooth Speaker","description":"Waterproof IPX7 speaker, 12h battery, 360° surround sound.","price":79.99,"stock":55,"category":"Electronics","image_url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/JBL_Flip_3_bluetooth_speaker_%28DSCF2653%29.jpg/500px-JBL_Flip_3_bluetooth_speaker_%28DSCF2653%29.jpg"}')

ok "Products created"

# ── Create orders ──────────────────────────────────────────────────────────────

info "Creating orders..."

create_order() {
  local token="$1" data="$2"
  post "$ORDER_SVC" "$data" "$token" > /dev/null
}

create_order "$TOKEN_ALICE" "{\"items\":[{\"product_id\":\"$P2\",\"product_name\":\"Mechanical Keyboard\",\"price\":129.99,\"quantity\":1},{\"product_id\":\"$P8\",\"product_name\":\"Smart LED Desk Lamp\",\"price\":59.99,\"quantity\":1}]}"
create_order "$TOKEN_ALICE" "{\"items\":[{\"product_id\":\"$P6\",\"product_name\":\"Python Programming Book\",\"price\":49.99,\"quantity\":2}]}"
create_order "$TOKEN_BOB"   "{\"items\":[{\"product_id\":\"$P1\",\"product_name\":\"Wireless Noise-Cancelling Headphones\",\"price\":249.99,\"quantity\":1}]}"
create_order "$TOKEN_BOB"   "{\"items\":[{\"product_id\":\"$P5\",\"product_name\":\"Running Shoes\",\"price\":89.99,\"quantity\":1},{\"product_id\":\"$P7\",\"product_name\":\"Yoga Mat\",\"price\":29.99,\"quantity\":1}]}"
create_order "$TOKEN_CAROL" "{\"items\":[{\"product_id\":\"$P3\",\"product_name\":\"Ergonomic Office Chair\",\"price\":399.00,\"quantity\":1}]}"
create_order "$TOKEN_CAROL" "{\"items\":[{\"product_id\":\"$P4\",\"product_name\":\"Stainless Steel Water Bottle\",\"price\":34.95,\"quantity\":3},{\"product_id\":\"$P9\",\"product_name\":\"Coffee Grinder\",\"price\":79.99,\"quantity\":1}]}"

ok "Orders created"

# ── Create reviews ─────────────────────────────────────────────────────────────

info "Creating reviews..."

create_review() {
  local token="$1" product_id="$2" data="$3"
  post "$REVIEW_SVC/$product_id/reviews" "$data" "$token" > /dev/null
}

create_review "$TOKEN_BOB"   "$P1" '{"rating":5,"comment":"Incredible sound quality. The ANC is impressive and battery life is exactly as advertised."}'
create_review "$TOKEN_CAROL" "$P1" '{"rating":4,"comment":"Very comfortable for long sessions. Slightly pricey but worth it."}'
create_review "$TOKEN_ALICE" "$P2" '{"rating":5,"comment":"Best keyboard I have ever used. The tactile feedback is perfect for coding."}'
create_review "$TOKEN_CAROL" "$P2" '{"rating":4,"comment":"Solid build quality. Took a week to get used to the layout but now I love it."}'
create_review "$TOKEN_ALICE" "$P3" '{"rating":5,"comment":"My back pain is gone after switching to this chair. Assembly took 30 minutes."}'
create_review "$TOKEN_BOB"   "$P3" '{"rating":3,"comment":"Good chair but the armrests feel a bit flimsy. Otherwise comfortable."}'
create_review "$TOKEN_ALICE" "$P4" '{"rating":5,"comment":"Keeps my coffee hot for hours. Fits in my bike bottle cage too."}'
create_review "$TOKEN_CAROL" "$P5" '{"rating":4,"comment":"Lightweight and breathable. Good grip on trails. Runs a half size small."}'
create_review "$TOKEN_ALICE" "$P6" '{"rating":5,"comment":"Best Python book on the market. The async chapter alone is worth the price."}'
create_review "$TOKEN_BOB"   "$P7" '{"rating":4,"comment":"Good thickness and grip. The alignment lines are actually useful."}'
create_review "$TOKEN_ALICE" "$P8" '{"rating":5,"comment":"The USB-C charging port is a game changer. Light quality is excellent."}'
create_review "$TOKEN_BOB"   "$P9" '{"rating":5,"comment":"Consistent grind, easy to clean. Makes a noticeable difference in espresso quality."}'
create_review "$TOKEN_BOB"   "$P10" '{"rating":4,"comment":"Good sound for the price. Waterproofing held up in the rain. Battery is accurate."}'
create_review "$TOKEN_CAROL" "$P10" '{"rating":3,"comment":"Sound is decent but bass is a bit weak. Great for the outdoors though."}'

ok "Reviews created"

# ── Summary ────────────────────────────────────────────────────────────────────

echo ""
echo "Seed complete."
echo "  Users:    alice@example.com / bob@example.com / carol@example.com  (password: password123)"
echo "  Products: 10"
echo "  Orders:   6"
echo "  Reviews:  14"
echo ""
echo "  Storefront: http://localhost:3000"
