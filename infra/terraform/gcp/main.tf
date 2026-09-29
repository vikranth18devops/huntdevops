terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "huntdevops-tfstate-project-e746f24e-392a-429f-a4d"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

# 1. VPC & Subnetwork Module
module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  subnet_cidr  = var.subnet_cidr
}

# 2. Artifact Registry Module
module "artifact_registry" {
  source        = "./modules/artifact_registry"
  region        = var.region
  repository_id = var.repository_id
}

# 3. GKE Cluster Module
module "gke" {
  source                 = "./modules/gke"
  gcp_project_id         = var.gcp_project_id
  project_name           = var.project_name
  environment            = var.environment
  region                 = var.region
  zone                   = var.zone
  network_name           = module.vpc.network_name
  subnet_name            = module.vpc.subnet_name
  pods_ip_range_name     = module.vpc.pods_ip_range_name
  services_ip_range_name = module.vpc.services_ip_range_name
  node_count             = var.node_count
  machine_type           = var.machine_type
}

# 4. IAM & CI/CD Service Account Module
module "iam" {
  source         = "./modules/iam"
  gcp_project_id = var.gcp_project_id
  project_name   = var.project_name
}

# 5. Cloud SQL PostgreSQL Database Module
module "cloudsql" {
  source        = "./modules/cloudsql"
  project_name  = var.project_name
  environment   = var.environment
  region        = var.region
  network_id    = module.vpc.network_id
  db_name       = var.db_name
  db_user       = var.db_user
  db_password   = var.db_password
  tier          = var.cloudsql_tier
}

