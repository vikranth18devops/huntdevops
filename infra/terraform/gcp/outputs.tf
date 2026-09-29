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

output "cloudsql_instance_name" {
  value       = module.cloudsql.instance_name
  description = "Cloud SQL Instance Name"
}

output "cloudsql_instance_connection_name" {
  value       = module.cloudsql.instance_connection_name
  description = "Cloud SQL Instance Connection Name"
}

output "cloudsql_private_ip" {
  value       = module.cloudsql.private_ip_address
  description = "Cloud SQL Private IP Address"
}

output "cloudsql_public_ip" {
  value       = module.cloudsql.public_ip_address
  description = "Cloud SQL Public IP Address"
}

output "cloudsql_database_name" {
  value       = module.cloudsql.database_name
  description = "Cloud SQL Database Name"
}

