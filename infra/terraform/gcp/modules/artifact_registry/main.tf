resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.repository_id
  description   = "Docker artifact registry repository for HuntDevOps container images"
  format        = "DOCKER"

  docker_config {
    immutable_tags = false
  }
}
