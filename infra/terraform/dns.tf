locals {
  # For prod: no suffix. For any other environment: ".env" suffix on subdomains.
  # e.g. dev -> "stackshop.dev.yourdomain.xyz"
  #      prod -> "stackshop.yourdomain.xyz"
  suffix = var.environment == "prod" ? "" : ".${var.environment}"

  subdomains = toset([
    "stackshop",
    "user",
    "product",
    "order",
    "cart",
    "search",
    "review",
  ])
}

resource "cloudflare_record" "stackshop" {
  for_each = local.subdomains

  zone_id = var.cloudflare_zone_id
  name    = "${each.value}${local.suffix}"
  content = hcloud_server.stackshop.ipv4_address
  type    = "A"
  ttl     = 60
  proxied = false
}
