output "server_ip" {
  description = "Public IPv4 address of the server"
  value       = hcloud_server.stackshop.ipv4_address
}

output "server_name" {
  description = "Server name in Hetzner"
  value       = hcloud_server.stackshop.name
}

output "dns_records" {
  description = "DNS records created in Cloudflare"
  value = {
    apex = cloudflare_record.apex.name
    www  = cloudflare_record.www.name
  }
}
