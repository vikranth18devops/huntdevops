# 10 - Comprehensive Troubleshooting & Diagnostics Guide

This document provides a beginner-friendly diagnostic matrix for resolving issues across Docker, Trivy, GCP Artifact Registry, Helm, Kubernetes, Argo CD, and GitHub Actions CI/CD pipelines.

---

## ⚡ Quick Diagnostic Health Check

Run these rapid commands to instantly locate where an issue is occurring:

```bash
# 1. Check GKE Cluster Status
gcloud container clusters describe prod-huntdevops-gke --zone us-central1-a --project project-e746f24e-392a-429f-a4d --format="value(status)"

# 2. Check Kubernetes Pod Status
kubectl get pods -n huntdevops -o wide

# 3. Check Pod Logs (if CrashLoopBackOff)
kubectl logs -n huntdevops -l app=backend --tail=50

# 4. Check Argo CD App Status
argocd app get huntdevops-app

# 5. Check Terraform State
cd infra/terraform/gcp && terraform state list
```

---

## 🔍 Diagnostic Matrix

### Issue 1: Docker Build Fails (`npm ci` or Compilation Error)
* **Problem**: `docker build` fails during the npm installation or TypeScript build stage.
* **Possible Cause**: Missing package dependency, incompatible Node version, or syntax errors in TypeScript code.
* **How to Check**:
  ```bash
  cd backend && npm run build
  cd ../frontend && npm run build
  ```
* **How to Fix**: Fix local code syntax errors or missing dependencies in `package.json` before running `docker build`.

---

### Issue 2: Trivy Security Scan Fails with Exit Code 1
* **Problem**: The CI pipeline stops at Stage 2 with message `Trivy Vulnerability Scan failed`.
* **Possible Cause**: Container base image (e.g. `node:20`) or NPM packages contain `CRITICAL` or `HIGH` security vulnerabilities.
* **How to Check**:
  ```bash
  trivy image --severity CRITICAL,HIGH huntdevops-backend:test
  ```
* **How to Fix**:
  1. Upgrade the base image in `Dockerfile` to a newer patch version (e.g. `node:20-alpine3.20`).
  2. Update vulnerable NPM packages by running `npm audit fix`.

---

### Issue 3: GCP Artifact Registry Authentication Error (`401 Unauthorized` / `Permission Denied`)
* **Problem**: `docker push` fails with `denied: Permission "artifactregistry.repositories.uploadArtifacts" denied`.
* **Possible Cause**: Docker CLI is not authenticated with GCP or the Service Account lacks `roles/artifactregistry.writer`.
* **How to Check**:
  ```bash
  gcloud artifacts repositories list
  ```
* **How to Fix**:
  1. Re-authenticate Docker daemon: `gcloud auth configure-docker us-central1-docker.pkg.dev --quiet`.
  2. Grant writer permission:
     ```bash
     gcloud projects add-iam-policy-binding project-e746f24e-392a-429f-a4d \
       --member="serviceAccount:huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com" \
       --role="roles/artifactregistry.writer"
     ```

---

### Issue 4: Helm Chart Linting or Rendering Fails (`helm lint` Error)
* **Problem**: `helm lint` returns indentation or missing variable errors.
* **Possible Cause**: Incorrect YAML syntax or referencing undefined values in templates.
* **How to Check**:
  ```bash
  helm lint helm/huntdevops
  helm template huntdevops helm/huntdevops
  ```
* **How to Fix**: Correct YAML spacing (Kubernetes YAML requires strict 2-space indentation) and ensure all template references match `values.yaml`.

---

### Issue 5: Kubernetes Pod in `ImagePullBackOff` State
* **Problem**: `kubectl get pods` shows `ImagePullBackOff` or `ErrImagePull`.
* **Possible Cause**: The image tag in `helm/huntdevops/values.yaml` does not exist in Artifact Registry or GKE lacks registry pull secret/Workload Identity access.
* **How to Check**:
  ```bash
  kubectl describe pod <pod-name> -n huntdevops
  ```
* **How to Fix**:
  1. Verify the exact tag uploaded to Artifact Registry:
     ```bash
     gcloud artifacts docker images list us-central1-docker.pkg.dev/project-e746f24e-392a-429f-a4d/huntdevops-repo/backend
     ```
  2. Ensure GKE node service account has `roles/artifactregistry.reader` permission.

---

### Issue 6: Kubernetes Pod in `CrashLoopBackOff` State
* **Problem**: Pod starts but repeatedly crashes and restarts.
* **Possible Cause**: Database connection failure, missing environment variables, or runtime application crash.
* **How to Check**:
  ```bash
  kubectl logs <pod-name> -n huntdevops --previous
  ```
* **How to Fix**:
  1. Check PostgreSQL service connectivity (`huntdevops-postgres:5432`).
  2. Inspect secret values in `huntdevops-postgres-secret`.

---

### Issue 7: Argo CD OutOfSync or Sync Failed Error
* **Problem**: Argo CD dashboard displays `OutOfSync` status or red sync error.
* **Possible Cause**: Git repository path incorrect, invalid Kubernetes manifest, or cluster permission issue.
* **How to Check**:
  ```bash
  argocd app get huntdevops-app
  ```
* **How to Fix**:
  1. Verify path in `infra/argo/application.yaml` points to `helm/huntdevops`.
  2. Trigger manual sync: `argocd app sync huntdevops-app`.

---

### Issue 8: Infinite GitHub Actions CI/CD Pipeline Loop
* **Problem**: GitHub Actions continuously triggers new pipeline runs after every deployment commit.
* **Possible Cause**: The automated Git commit updating `values.yaml` is missing the `[skip ci]` tag.
* **How to Check**: Inspect the commit message of the automated bot push in GitHub commit history.
* **How to Fix**: Ensure git commit message includes `[skip ci]`:
  ```bash
  git commit -m "chore(helm): update container image tags to ${{ github.sha }} [skip ci]"
  ```

---

### Issue 9: Service Account Key Creation Blocked (`constraints/iam.disableServiceAccountKeyCreation`)
* **Problem**: `gcloud iam service-accounts keys create` fails with `FAILED_PRECONDITION: Key creation is not allowed on this service account`.
* **Possible Cause**: Google Cloud enforces an Organization Policy constraint blocking downloadable JSON private keys.
* **How to Fix**: Use **Workload Identity Federation (WIF)** instead of static keys. GitHub Actions authenticates via short-lived OIDC tokens:
  ```yaml
  - name: Authenticate to Google Cloud Platform
    uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: 'projects/174952050783/locations/global/workloadIdentityPools/huntdevops-pool/providers/huntdevops-provider'
      service_account: 'huntdevops-cicd-sa@project-e746f24e-392a-429f-a4d.iam.gserviceaccount.com'
  ```

---

### Issue 10: Terraform Resource Conflict (`Error 409: Already Exists`)
* **Problem**: `terraform apply` fails because a resource (like Artifact Registry or Service Account) already exists in GCP but is missing from local state.
* **How to Fix**: Import the existing resource into Terraform state using `terraform import`:
  ```bash
  terraform import -var-file="terraform.tfvars" \
    module.artifact_registry.google_artifact_registry_repository.repo \
    projects/project-e746f24e-392a-429f-a4d/locations/us-central1/repositories/huntdevops-repo
  ```

---

### Issue 11: GKE Resource Availability Error (`GCE_STOCKOUT`)
* **Problem**: `Error waiting for creating GKE cluster: Google Compute Engine does not have enough resources available to fulfill request: us-central1`.
* **Possible Cause**: Multi-zone regional clusters deploy across all zones, hitting capacity or quota limits on Spot/Preemptible VMs.
* **How to Fix**: Configure a specific zone (`zone = "us-central1-a"`) in `terraform.tfvars`. Zonal clusters provision in a single zone and provide 1 free GKE control plane.

---

### Issue 12: Terraform State Lock Error (`Error acquiring the state lock`)
* **Problem**: `Error acquiring the state lock: resource temporarily unavailable`.
* **Possible Cause**: Another `terraform apply` is currently in progress, or a previous run was abruptly killed while holding the lock.
* **How to Fix**:
  1. Wait for any active `terraform apply` to finish.
  2. If the operation is definitely dead, release the lock manually:
     ```bash
     terraform force-unlock <LOCK_ID>
     ```

---

### Issue 13: Argo CD CRD Annotation Size Limit (`metadata.annotations: Too long`)
* **Problem**: `The CustomResourceDefinition "applicationsets.argoproj.io" is invalid: metadata.annotations: Too long: may not be more than 262144 bytes`.
* **Possible Cause**: Client-side `kubectl apply` stores the entire manifest in the `kubectl.kubernetes.io/last-applied-configuration` annotation, exceeding the 256KB Kubernetes annotation limit.
* **How to Fix**: Use server-side apply with force conflicts:
  ```bash
  kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  ```

---

### Issue 14: GKE Pod ErrImagePull / 403 Forbidden from Artifact Registry
* **Problem**: Pods remain in `ImagePullBackOff` or `ErrImagePull` with event: `failed to authorize: failed to fetch oauth token: unexpected status 403 Forbidden`.
* **Possible Cause**: The GKE node Compute Engine default service account lacks read permissions on Artifact Registry.
* **How to Fix**: Grant `roles/artifactregistry.reader` to the compute service account:
  ```bash
  PROJECT_NUM=$(gcloud projects describe project-e746f24e-392a-429f-a4d --format="value(projectNumber)")
  
  gcloud projects add-iam-policy-binding project-e746f24e-392a-429f-a4d \
    --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
    --role="roles/artifactregistry.reader"
  
  # Restart the affected pods
  kubectl delete pods -n huntdevops --all
  ```

---

### Issue 15: Node CommonJS Runtime Error in Docker Container
* **Problem**: Backend pod crashes with `ReferenceError: exports is not defined in ES module scope`.
* **Possible Cause**: `tsconfig.json` compiles TypeScript to CommonJS, but `package.json` specifies `"type": "module"`, causing Node.js to treat `.js` files as ES modules.
* **How to Fix**: Remove `"type": "module"` from `backend/package.json` so Node treats compiled `.js` files as CommonJS.

---

### Issue 16: PostgreSQL PVC Stuck in Pending on GKE
* **Problem**: PostgreSQL pod stays in `ContainerCreating` or `Pending` with unbound PersistentVolumeClaim.
* **Possible Cause**: Invalid StorageClass specified (e.g. `standard-rwd` instead of GKE's default `standard-rwo`).
* **How to Fix**: Set `storageClass: standard-rwo` in `helm/huntdevops/values.yaml`. Verify available classes with `kubectl get storageclass`.

---

### Issue 17: Local Port 5432 Already in Use (`bind: address already in use`)
* **Problem**: Running `kubectl port-forward svc/huntdevops-postgres -n huntdevops 5432:5432` fails with:
  ```text
  Unable to listen on port 5432: Listeners failed to create with the following errors:
  [unable to create listener: Error listen tcp4 127.0.0.1:5432: bind: address already in use]
  ```
* **Possible Cause**: A local PostgreSQL instance, brew service, or Docker desktop container is already running and occupying local port 5432.
* **How to Fix**: Forward to an alternate local port (such as `5434` or `5433`):
  ```bash
  # Forward cluster port 5432 to local port 5434:
  kubectl port-forward svc/huntdevops-postgres -n huntdevops 5434:5432
  ```
  Connect using pgAdmin / psql on `localhost:5434`:
  ```bash
  PGPASSWORD='HuntDevOpsSecurePassword2026!' psql -h localhost -p 5434 -U postgres -d huntdevops
  ```

---

### Issue 18: Argo CD Subpath Blank Screen or 404 on Assets behind Traefik (`/argocd`)
* **Problem**: Accessing `https://vikranthsunkarpally.in/argocd/` returns a blank white screen, or browser network tab shows `404 Not Found` for `main.*.js` and `fonts.css`.
* **Possible Cause**: Argo CD server's `--basehref` and `--rootpath` are either unset or mismatched (e.g. one has trailing slash `/argocd/` while the other is `/argocd`), causing Argo CD to log `--basehref and --rootpath had conflict` and fall back to `<base href="/">`. Traefik routes `/main.*.js` to the frontend Nginx instead of Argo CD.
* **How to Fix**:
  1. Synchronize `argocd-cmd-params-cm`:
     ```yaml
     server.basehref: "/argocd"
     server.rootpath: "/argocd"
     server.insecure: "true"
     ```
  2. Ensure `argocd-cm` contains `url: "https://vikranthsunkarpally.in/argocd"`.
  3. Patch container command and args in `deployment/argocd-server`:
     ```bash
     kubectl patch deployment argocd-server -n argocd --type='json' -p='[
       {"op": "replace", "path": "/spec/template/spec/containers/0/command", "value": ["/usr/local/bin/argocd-server"]},
       {"op": "replace", "path": "/spec/template/spec/containers/0/args", "value": ["--basehref", "/argocd", "--rootpath", "/argocd", "--insecure"]}
     ]'
     ```
  4. Verify HTML output has injected base href:
     ```bash
     curl -kLs -H "Accept: text/html" https://vikranthsunkarpally.in/argocd/ | grep -i "base href"
     # Output: <base href="/argocd/">
     ```

---

### Issue 19: CSV Question Import Error in Admin Portal ("Error parsing CSV file")
* **Problem**: Uploading a multi-module or sub-module question CSV in the Admin Portal shows:
  `"Error parsing CSV file. Please make sure it follows the recommended template."`
* **Possible Cause**: 
  1. CSV saved with semicolon (`;`) or tab delimiters instead of commas (`,`).
  2. UTF-8 Byte Order Mark (`\uFEFF`) attached by Microsoft Excel.
  3. Non-standard or case-sensitive header naming (`Module ID`, `SubModule`, `Option 1`).
* **How to Fix**:
  The Admin Portal parser features:
  - Automatic delimiter detection (`,`, `;`, `\t`).
  - Automatic stripping of UTF-8 BOM characters.
  - Case-insensitive synonym header matching (`topicId`, `topic_id`, `module`, `sectionId`, `submodule`).
  - Drag-and-drop file upload support.
  - Multi-module row grouping so multiple modules and sub-modules can be imported in a single file.

---

### Issue 20: Cloud SQL Database Connection Failed or Timeout
* **Problem**: Backend logs show `⚠️ PostgreSQL connection note: connect ETIMEDOUT` or `password authentication failed for user "postgres"`.
* **Possible Cause**: 
  1. `DB_HOST` in `helm/huntdevops/values.yaml` is pointing to old in-cluster DNS (`huntdevops-postgres`) instead of Cloud SQL Private IP (`10.154.0.3`).
  2. VPC Peering Service Networking connection (`servicenetworking.googleapis.com`) is not established between the GKE VPC and Google Services.
  3. `DB_PASSWORD` secret does not match the provisioned Cloud SQL password (`HuntDevOpsCloudSQL2026!`).
* **How to Fix**:
  1. Verify Cloud SQL private and public IP via gcloud:
     ```bash
     gcloud sql instances describe prod-huntdevops-psql-2eecc976 --format="table(name,ipAddresses[0].ipAddress,ipAddresses[1].ipAddress)"
     ```
  2. Verify VPC peering connection from Terraform outputs:
     ```bash
     terraform -chdir=infra/terraform/gcp output cloudsql_private_ip
     ```
  3. Ensure `helm/huntdevops/values.yaml` sets:
     - `DB_HOST: "10.154.0.3"`
     - `rawPassword: "HuntDevOpsCloudSQL2026!"`
  4. Test connectivity directly from a pod or local psql:
     ```bash
     PGPASSWORD='HuntDevOpsCloudSQL2026!' psql -h 35.232.123.246 -p 5432 -U postgres -d huntdevops -c "\l"
     ```

---

## ⏭️ Next Step

Proceed to the complete access URLs, credentials, and validation guide:
👉 **[10 - Live Access URLs & Credentials Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/10-access-urls-and-credentials.md)**



