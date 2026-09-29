variable "gcp_project_id" {
  type        = string
  description = "Google Cloud Project ID"
}

variable "project_name" {
  type        = string
  default     = "huntdevops"
  description = "Project name"
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Environment name (dev/prod)"
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP Region"
}

variable "zone" {
  type        = string
  default     = "us-central1-a"
  description = "GCP Zone for GKE Cluster (prevents regional capacity stockout)"
}

variable "subnet_cidr" {
  type        = string
  default     = "10.0.0.0/20"
  description = "VPC Subnet CIDR"
}

variable "repository_id" {
  type        = string
  default     = "huntdevops-repo"
  description = "Artifact Registry repository ID"
}

variable "node_count" {
  type        = number
  default     = 2
  description = "GKE node count per zone"
}

variable "machine_type" {
  type        = string
  default     = "e2-standard-2"
  description = "GKE Node Instance Machine Type"
}

variable "db_name" {
  type        = string
  default     = "huntdevops"
  description = "Cloud SQL database name"
}

variable "db_user" {
  type        = string
  default     = "postgres"
  description = "Cloud SQL admin user"
}

variable "db_password" {
  type        = string
  default     = "HuntDevOpsCloudSQL2026!"
  description = "Cloud SQL database password"
  sensitive   = true
}

variable "cloudsql_tier" {
  type        = string
  default     = "db-g1-small"
  description = "Cloud SQL machine tier"
}

