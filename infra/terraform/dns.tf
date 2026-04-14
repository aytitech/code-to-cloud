locals {
  # For prod: no prefix. For any other environment: "env-" prefix on subdomains.
  # e.g. dev -> "dev-cloudmart.yourdomain.xyz"
  #      prod -> "cloudmart.yourdomain.xyz"
  prefix = var.environment == "prod" ? "" : "${var.environment}-"

  subdomains = toset([
    "cloudmart",
    "user",
    "product",
    "order",
    "cart",
    "search",
    "review",
    "registry",
  ])
}

resource "cloudflare_record" "cloudmart" {
  for_each = local.subdomains

  zone_id = var.cloudflare_zone_id
  name    = "${local.prefix}${each.value}"
  content = hcloud_server.cloudmart.ipv4_address
  type    = "A"
  ttl     = 60
  proxied = false
}
