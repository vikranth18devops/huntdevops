variable "gcp_project_id" {
  type        = string
  description = "GCP Project ID"
}

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

variable "zone" {
  type        = string
  default     = ""
  description = "Specific zone for zonal GKE cluster. If empty, uses var.region for regional cluster."
}

variable "network_name" {
  type        = string
  description = "VPC Network Name"
}

variable "subnet_name" {
  type        = string
  description = "Subnetwork Name"
}

variable "pods_ip_range_name" {
  type        = string
  description = "Secondary range name for Pods"
}

variable "services_ip_range_name" {
  type        = string
  description = "Secondary range name for Services"
}

variable "node_count" {
  type        = number
  default     = 2
  description = "Initial node count per zone"
}

variable "min_node_count" {
  type        = number
  default     = 1
  description = "Minimum node count for autoscaling"
}

variable "max_node_count" {
  type        = number
  default     = 5
  description = "Maximum node count for autoscaling"
}

variable "machine_type" {
  type        = string
  default     = "e2-standard-2"
  description = "GKE Node Machine Type"
}

variable "use_spot_nodes" {
  type        = bool
  default     = true
  description = "Use Preemptible/Spot nodes to save cost"
}
