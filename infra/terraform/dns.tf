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

# TODO: define the cloudflare_record resource
# It should use for_each over local.subdomains and create one A record per subdomain.
# Each record should:
#   zone_id = var.cloudflare_zone_id
#   name    = "${local.prefix}${each.value}"
#   content = hcloud_server.cloudmart.ipv4_address   <- IP from the server resource
#   type    = "A"
#   ttl     = 60
#   proxied = false
