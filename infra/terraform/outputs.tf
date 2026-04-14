output "server_ip" {
  description = "Public IPv4 address of the server"
  value       = hcloud_server.cloudmart.ipv4_address
}

output "server_name" {
  description = "Server name in Hetzner"
  value       = hcloud_server.cloudmart.name
}

output "dns_records" {
  description = "DNS records created in Cloudflare"
  value = {
    for name, record in cloudflare_record.cloudmart : name => record.name
  }
}
