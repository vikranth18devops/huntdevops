variable "region" {
  type        = string
  description = "GCP Region"
}

variable "repository_id" {
  type        = string
  default     = "huntdevops-repo"
  description = "Artifact Registry Repository ID"
}
