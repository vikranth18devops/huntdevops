output "vpc_network_name" {
  value       = module.vpc.network_name
  description = "Name of created VPC Network"
}

output "gke_cluster_name" {
  value       = module.gke.cluster_name
  description = "GKE Cluster Name"
}

output "gke_cluster_endpoint" {
  value       = module.gke.cluster_endpoint
  description = "GKE Cluster Endpoint"
}

output "artifact_registry_url" {
  value       = module.artifact_registry.repository_url
  description = "GCP Artifact Registry Repository URL"
}

output "cicd_service_account_email" {
  value       = module.iam.service_account_email
  description = "CI/CD Service Account Email"
}
