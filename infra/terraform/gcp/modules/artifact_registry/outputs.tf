output "repository_name" {
  value       = google_artifact_registry_repository.repo.name
  description = "Artifact Registry Repository Name"
}

output "repository_url" {
  value       = "${var.region}-docker.pkg.dev/${google_artifact_registry_repository.repo.project}/${google_artifact_registry_repository.repo.repository_id}"
  description = "Full Docker Repository Base URL"
}
