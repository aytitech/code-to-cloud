locals {
  # prod -> bare domain. Any other environment -> "env." prefix.
  #   prod -> yourdomain.xyz
  #   dev  -> dev.yourdomain.xyz
  prefix    = var.environment == "prod" ? "" : "${var.environment}."
  base      = "${local.prefix}${var.domain}"
  apex_name = var.environment == "prod" ? "@" : var.environment
  www_name  = var.environment == "prod" ? "www" : "www.${var.environment}"
}

resource "cloudflare_record" "apex" {
  zone_id = var.cloudflare_zone_id
  name    = local.apex_name
  content = hcloud_server.stackshop.ipv4_address
  type    = "A"
  ttl     = 60
  proxied = false
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = local.www_name
  content = local.base
  type    = "CNAME"
  ttl     = 60
  proxied = false
}
