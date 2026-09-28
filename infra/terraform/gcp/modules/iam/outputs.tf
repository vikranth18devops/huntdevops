output "service_account_email" {
  value       = google_service_account.cicd_sa.email
  description = "Service Account Email for CI/CD"
}
