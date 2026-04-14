resource "hcloud_ssh_key" "default" {
  name       = "${var.environment}-cloudmart-key"
  public_key = var.ssh_public_key
}

resource "hcloud_firewall" "cloudmart" {
  name = "${var.environment}-cloudmart-fw"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "cloudmart" {
  name         = "${var.environment}-cloudmart"
  image        = "ubuntu-24.04"
  server_type  = var.server_type
  location     = var.location
  ssh_keys     = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.cloudmart.id]
  user_data    = file("${path.module}/cloud-init.yml")
}
