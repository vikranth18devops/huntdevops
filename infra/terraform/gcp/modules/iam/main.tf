resource "google_service_account" "cicd_sa" {
  account_id   = "${var.project_name}-cicd-sa"
  display_name = "GitHub Actions CI/CD Service Account for HuntDevOps"
}

resource "google_project_iam_member" "gar_writer" {
  project = var.gcp_project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cicd_sa.email}"
}

resource "google_project_iam_member" "gke_developer" {
  project = var.gcp_project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.cicd_sa.email}"
}
