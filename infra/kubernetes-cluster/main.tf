resource "hcloud_ssh_key" "k8s" {
  name       = "${var.environment}-k8s-key"
  public_key = var.ssh_public_key
}

resource "hcloud_firewall" "k8s" {
  name = "${var.environment}-k8s-firewall"

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

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "6443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# TODO: define the hcloud_server resource for the k3s cluster node
# Use resource name "k8s_node" - outputs.tf depends on this name.
# It should use:
#   name         = "${var.environment}-k8s-node"
#   image        = "ubuntu-24.04"
#   server_type  = var.server_type
#   location     = var.location
#   ssh_keys     = [hcloud_ssh_key.k8s.id]
#   firewall_ids = [hcloud_firewall.k8s.id]
#   user_data    = file("${path.module}/cloud-init-k3s.yml")
