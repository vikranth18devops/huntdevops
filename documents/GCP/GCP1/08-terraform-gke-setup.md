# 08 - Terraform Modular GKE Infrastructure Guide

This document details the **Terraform** Infrastructure as Code (IaaC) architecture used to provision the Google Cloud Platform infrastructure for **HuntDevOps**.

---

## 🏗️ Modular Architecture Layout

Terraform code is organized under `infra/terraform/gcp/` using reusable modules:

```text
infra/terraform/gcp/
├── main.tf                    # Root composition file connecting modules
├── variables.tf               # Global input variables
├── outputs.tf                 # Cluster endpoints & repository outputs
├── terraform.tfvars.example   # Sample environment values
└── modules/
    ├── vpc/                   # Custom VPC network & secondary CIDR subnets
    ├── artifact_registry/     # Docker Artifact Registry repository
    ├── gke/                   # Autoscale GKE cluster & node pools
    └── iam/                   # CI/CD service account & RBAC roles
```

---

## 📦 Module Descriptions

### 1. VPC Network Module (`modules/vpc`)
* Provisions a custom VPC (`google_compute_network`) without default auto-subnets.
* Creates a dedicated GKE subnetwork (`google_compute_subnetwork`) with secondary IP ranges for **Pods** (`10.16.0.0/14`) and **Services** (`10.20.0.0/20`).

### 2. Artifact Registry Module (`modules/artifact_registry`)
* Provisions the Docker repository `huntdevops-repo` in region `us-central1`.

### 3. GKE Cluster Module (`modules/gke`)
* Creates a VPC-native, regional GKE cluster with **Workload Identity** enabled.
* Provisions a managed Node Pool with autoscaling (`1` to `5` nodes) and spot node support (`e2-standard-2`).

### 4. IAM Module (`modules/iam`)
* Creates the service account `huntdevops-cicd-sa`.
* Binds `roles/artifactregistry.writer` and `roles/container.developer` permissions.

---

## ⚙️ Execution Lifecycle Commands

Follow these steps to provision or update GCP infrastructure:

### 1. Initialize Terraform Directory
Downloads provider plugins (Google v5.x) and initializes module references:
```bash
cd infra/terraform/gcp
terraform init
```

### 2. Validate Configuration Syntax
```bash
terraform validate
```

### 3. Generate Execution Plan
Previews resources to be created:
```bash
terraform plan -var-file="terraform.tfvars.example"
```

### 4. Apply & Provision Infrastructure
```bash
terraform apply -var-file="terraform.tfvars.example" -auto-approve
```

### 5. Obtain `kubectl` Credentials for GKE
After provisioning completes, connect your local `kubectl` to the new GKE cluster:
```bash
gcloud container clusters get-credentials prod-huntdevops-gke --zone us-central1-a --project project-e746f24e-392a-429f-a4d
```

---

## 🗄️ Remote State Management (Google Cloud Storage)

For team collaboration, state locking, and disaster recovery, Terraform state is stored remotely in Google Cloud Storage:

### 1. GCS State Bucket Configuration
* **Bucket**: `gs://huntdevops-tfstate-project-e746f24e-392a-429f-a4d`
* **Location**: `us-central1`
* **Object Versioning**: **Enabled** (protects against corruption and tracks state history).

### 2. Backend Block Configuration (`main.tf`)
```hcl
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
```

### 3. Migrating Local State to GCS Backend
To migrate existing local `terraform.tfstate` into the remote bucket:
```bash
terraform init -migrate-state
```
Type `yes` when prompted to copy existing state to the new backend.

---

## 🔧 Troubleshooting & Known Tips

### 1. Resolving `Error 409: Already Exists`
If resources like Artifact Registry or Service Accounts were created outside Terraform (e.g. via `gcloud`), import them into Terraform state:
```bash
# Import Artifact Registry
terraform import -var-file="terraform.tfvars.example" \
  module.artifact_registry.google_artifact_registry_repository.repo \
  projects/project-e746f24e-392a-429f-a4d/locations/us-central1/repositories/huntdevops-repo

# Import CI/CD Service Account
terraform import -var-file="terraform.tfvars.example" \
  module.iam.google_service_account.cicd_sa \
  projects/project-e746f24e-392a-429f-a4d/serviceAccounts/huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com
```

### 2. Resolving GCE Stockout (`GCE_STOCKOUT`)
If GCP reports insufficient resources in regional clusters across all zones in `us-central1`, deploy as a zonal cluster using `zone = "us-central1-a"`. Zonal clusters also provide a free control plane in GCP.
