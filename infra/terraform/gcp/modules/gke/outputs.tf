output "cluster_name" {
  value       = google_container_cluster.primary.name
  description = "GKE Cluster Name"
}

output "cluster_endpoint" {
  value       = google_container_cluster.primary.endpoint
  description = "GKE Master Endpoint"
}

output "ca_certificate" {
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  description = "GKE Cluster CA Certificate"
}
