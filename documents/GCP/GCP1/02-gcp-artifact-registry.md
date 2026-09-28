# 02 - GCP Artifact Registry Setup & Authentication Guide

Google Artifact Registry (GAR) is GCP's fully managed, secure container repository service. It stores and secures Docker container images for **HuntDevOps** and integrates with Trivy security scans, GitHub Actions CI/CD, and GKE.

---

## 📋 Prerequisites

Before proceeding, ensure you have completed:
- [x] Installed `gcloud` CLI and authenticated (`gcloud auth login`).
- [x] Completed **[01-prerequisites.md](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/01-prerequisites.md)** (GCP project set and APIs enabled).
- [x] Docker installed and running on your local machine (`docker info`).

---

## 🏗️ Repository Provisioning (Choose One Approach)

Artifact Registry can be provisioned either through **Terraform (Recommended)** or via the **`gcloud` CLI**:

### Approach A: Terraform (Infrastructure as Code - Recommended)
The Artifact Registry repository is provisioned declaratively in [infra/terraform/gcp/modules/artifact_registry/main.tf](file:///Users/aarvik/Documents/huntdevops/infra/terraform/gcp/modules/artifact_registry/main.tf). Running `terraform apply` handles repository creation automatically.

### Approach B: Direct `gcloud` CLI Creation
If provisioning via CLI before running Terraform:
```bash
# 1. Create Docker format repository in us-central1
gcloud artifacts repositories create huntdevops-repo \
  --project="project-e746f24e-392a-429f-a4d" \
  --repository-format=docker \
  --location="us-central1" \
  --description="HuntDevOps Production Container Repository"
```

> ⚠️ **Important (Avoiding 409 Conflict)**: If you created the repository via `gcloud`, remember to import it into Terraform state when running Terraform later so it doesn't fail with `409 Already Exists`:
> ```bash
> cd infra/terraform/gcp
> terraform import module.artifact_registry.google_artifact_registry_repository.repo \
>   projects/project-e746f24e-392a-429f-a4d/locations/us-central1/repositories/huntdevops-repo
> ```

---

## 🔒 Docker Daemon Authentication

Configure your local Docker daemon to authenticate seamlessly against Google's `us-central1-docker.pkg.dev` registry:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
```
*Expected Output*: `Docker configuration file updated.`

---

## 🏷️ Container Image URL Structure

Artifact Registry image URLs follow standard GCP format:
```text
us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/<SERVICE>:<TAG>
```

For **HuntDevOps**:
* **Frontend Image**: `us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/frontend:<tag>`
* **Backend Image**: `us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend:<tag>`

---

## 🔐 IAM Permissions & Service Account

To allow GitHub Actions CI/CD to push container images to Artifact Registry:

```bash
# 1. Create CI/CD Service Account (if not created via Terraform)
gcloud iam service-accounts create huntdevops-cicd-sa \
  --project="project-e746f24e-392a-429f-a4d" \
  --display-name="HuntDevOps CI/CD Service Account"

# 2. Grant Artifact Registry Writer role
gcloud projects add-iam-policy-binding project-e746f24e-392a-429f-a4d \
  --member="serviceAccount:huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

---

## 🔍 Verification Commands

Verify that the repository is active and ready to accept Docker images:

```bash
# List all repositories in us-central1
gcloud artifacts repositories list --location=us-central1 --project=project-e746f24e-392a-429f-a4d

# List images inside huntdevops-repo
gcloud artifacts docker images list us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo
```

---

## ⏭️ Next Step

Once Artifact Registry is ready and Docker is authenticated, proceed to:
👉 **[03 - Docker Setup & Multi-Stage Containerization](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/03-docker-setup.md)**
