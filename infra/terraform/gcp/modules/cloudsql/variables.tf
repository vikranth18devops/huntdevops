variable "project_name" {
  type        = string
  description = "The prefix name of the project"
  default     = "huntdevops"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g. prod, staging)"
  default     = "prod"
}

variable "region" {
  type        = string
  description = "GCP Region for Cloud SQL"
  default     = "us-central1"
}

variable "database_version" {
  type        = string
  description = "PostgreSQL version"
  default     = "POSTGRES_16"
}

variable "tier" {
  type        = string
  description = "Cloud SQL machine tier"
  default     = "db-g1-small"
}

variable "network_id" {
  type        = string
  description = "VPC Network ID for Private IP configuration"
}

variable "db_name" {
  type        = string
  description = "Initial PostgreSQL database name"
  default     = "huntdevops"
}

variable "db_user" {
  type        = string
  description = "PostgreSQL admin username"
  default     = "postgres"
}

variable "db_password" {
  type        = string
  description = "PostgreSQL admin password"
  default     = "HuntDevOpsCloudSQL2026!"
  sensitive   = true
}

variable "authorized_networks" {
  type = list(object({
    name  = string
    value = string
  }))
  description = "List of authorized external IPv4 CIDRs that can access Cloud SQL via Public IP"
  default = [
    {
      name  = "all"
      value = "0.0.0.0/0"
    }
  ]
}
