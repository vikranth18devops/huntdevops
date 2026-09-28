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
