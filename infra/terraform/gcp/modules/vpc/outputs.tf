output "network_name" {
  value       = google_compute_network.vpc_network.name
  description = "Name of the VPC network"
}

output "network_id" {
  value       = google_compute_network.vpc_network.id
  description = "ID of the VPC network"
}

output "subnet_name" {
  value       = google_compute_subnetwork.gke_subnet.name
  description = "Name of the GKE subnetwork"
}

output "subnet_id" {
  value       = google_compute_subnetwork.gke_subnet.id
  description = "ID of the GKE subnetwork"
}

output "pods_ip_range_name" {
  value       = "pods"
  description = "Secondary IP range name for Pods"
}

output "services_ip_range_name" {
  value       = "services"
  description = "Secondary IP range name for Services"
}
