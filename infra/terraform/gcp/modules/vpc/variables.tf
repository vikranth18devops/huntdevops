variable "project_name" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Environment (dev/prod)"
}

variable "region" {
  type        = string
  description = "GCP Region"
}

variable "subnet_cidr" {
  type        = string
  default     = "10.0.0.0/20"
  description = "Primary Subnet CIDR block"
}

variable "pods_cidr" {
  type        = string
  default     = "10.16.0.0/14"
  description = "Secondary IP range CIDR for Pods"
}

variable "services_cidr" {
  type        = string
  default     = "10.20.0.0/20"
  description = "Secondary IP range CIDR for Services"
}
