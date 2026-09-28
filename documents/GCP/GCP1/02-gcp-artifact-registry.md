# 02 - GCP Artifact Registry Setup & Authentication Guide

Google Artifact Registry (GAR) is GCP's fully managed, secure container and artifact repository service. It replaces Google Container Registry (GCR) and provides fine-grained IAM access control, regional hosting, and vulnerability scanning integration.

---

## 🏗️ Step-by-Step Configuration Guide

### Step 1: Configure active GCP Project
Set your target GCP project in the `gcloud` CLI:
```bash
gcloud config set project huntdevops-gcp-prod
```

### Step 2: Enable Required GCP APIs
Enable Artifact Registry, Container, and IAM APIs:
```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  container.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### Step 3: Create the Artifact Registry Repository
Create a Docker format repository in region `us-central1`:
```bash
gcloud artifacts repositories create huntdevops-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="HuntDevOps Production Container Repository"
```

---

## 🔒 Authentication Configuration

### Local Docker CLI Authentication
Configure your local Docker daemon to authenticate seamlessly against `us-central1-docker.pkg.dev`:
```bash
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet
```

### Determining the Container Image Repository URL Structure
The URL structure for Artifact Registry images follows standard GCP conventions:
```text
[LOCATION]-docker.pkg.dev/[PROJECT_ID]/[REPOSITORY_NAME]/[IMAGE_NAME]:[TAG]
```
For **HuntDevOps**:
* **Frontend URL**: `us-central1-docker.pkg.dev/huntdevops-gcp-prod/huntdevops-repo/frontend:<tag>`
* **Backend URL**: `us-central1-docker.pkg.dev/huntdevops-gcp-prod/huntdevops-repo/backend:<tag>`

---

## 🔐 IAM Permissions & Service Account Setup

To allow GitHub Actions to build and push container images securely:

1. **Create CI/CD Service Account**:
   ```bash
   gcloud iam service-accounts create huntdevops-cicd-sa \
     --display-name="HuntDevOps CI/CD Service Account"
   ```

2. **Grant Artifact Registry Writer Role**:
   ```bash
   gcloud projects add-iam-policy-binding huntdevops-gcp-prod \
     --member="serviceAccount:huntdevops-cicd-sa@huntdevops-gcp-prod.iam.gserviceaccount.com" \
     --role="roles/artifactregistry.writer"
   ```

3. **Generate Service Account Key File**:
   ```bash
   gcloud iam service-accounts keys create ~/huntdevops-sa-key.json \
     --iam-account=huntdevops-cicd-sa@huntdevops-gcp-prod.iam.gserviceaccount.com
   ```
   > Copy the contents of `~/huntdevops-sa-key.json` into your GitHub repository secret named `GCP_SA_KEY`.

---

## 🔍 Verification of Image Pushes

To verify images uploaded to Artifact Registry via CLI:
```bash
# List all container packages in the repository
gcloud artifacts packages list --repository=huntdevops-repo --location=us-central1

# List specific tags for backend image
gcloud artifacts docker images list us-central1-docker.pkg.dev/huntdevops-gcp-prod/huntdevops-repo/backend
```
