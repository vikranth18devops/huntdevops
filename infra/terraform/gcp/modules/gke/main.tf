resource "google_container_cluster" "primary" {
  name                     = "${var.environment}-${var.project_name}-gke"
  location                 = var.region
  remove_default_node_pool = true
  initial_node_count       = 1
  network                  = var.network_name
  subnetwork               = var.subnet_name

  ip_allocation_policy {
    cluster_secondary_range_name  = var.pods_ip_range_name
    services_secondary_range_name = var.services_ip_range_name
  }

  workload_identity_config {
    workload_pool = "${var.gcp_project_id}.svc.id.goog"
  }

  deletion_protection = false
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.environment}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  node_config {
    preemptible  = var.use_spot_nodes
    machine_type = var.machine_type

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      environment = var.environment
      app         = var.project_name
    }

    tags = ["gke-node", "${var.environment}-${var.project_name}"]
  }
}
