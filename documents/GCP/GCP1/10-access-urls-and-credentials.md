# 10 - Application Access URLs, Endpoints & Credentials Guide

This reference document contains the complete **Live Public Internet URLs**, custom domain endpoints (**`huntdevops.online`**), port-forwarding alternatives, API endpoints, service topologies, and administrative credentials for **Frontend**, **Backend**, **PostgreSQL Database**, and the **Argo CD GitOps Dashboard** deployed on Google Kubernetes Engine (GKE).

---

## 🌐 Live Public URLs & Credentials Matrix (Custom Domain & Traefik)

All HTTP traffic is unified behind **Traefik**, exposed via a single Google Cloud Network Load Balancer with dedicated public IP **`136.112.185.77`** and mapped to custom domain **`huntdevops.online`**.

| Component | Path / Route | Live Domain URL | Direct Public IP URL | Default Username | Default Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **💻 Frontend Web UI** | `/` (Traefik) | **`https://huntdevops.online/`** | **`http://136.112.185.77/`** | N/A (Web UI) | N/A |
| **🛡️ Admin Portal** | `/admin` (Traefik) | **`https://huntdevops.online/admin`** | **`http://136.112.185.77/admin`** | `admin` | **`admin123`** |
| **⚙️ Backend REST API** | `/api/` (Traefik) | **`https://huntdevops.online/api/health`** | **`http://136.112.185.77/api/health`** | N/A (REST API) | N/A |
| **🐙 Argo CD GitOps UI** | `/argocd` (Traefik) | **`https://huntdevops.online/argocd/`** | **`http://136.112.185.77/argocd`** | `admin` | **`vmvSfJ72EtCyt1oX`** |
| **🐙 Argo CD Direct LB** | `443` (Direct) | N/A | **`https://136.112.167.2`** | `admin` | **`vmvSfJ72EtCyt1oX`** |
| **🐘 Cloud SQL PostgreSQL** | `5432` (Managed) | `10.154.0.3:5432` (Private VPC) | **`35.232.123.246:5432`** (Public) | `postgres` | **`HuntDevOpsCloudSQL2026!`** |


---

## 1. 💻 Frontend Application (Live on GKE via Traefik)

The frontend is a dark-mode React TypeScript single-page application served via Nginx and routed by Traefik on Google Kubernetes Engine.

### 🌐 Live Web URLs
* 👉 **[https://huntdevops.online/](https://huntdevops.online/)** (Custom Domain)
* 👉 **[http://136.112.185.77/](http://136.112.185.77/)** (Direct Traefik IP)

* **Traefik LoadBalancer IP**: `136.112.185.77`
* **Port**: `80` (HTTP) & `443` (HTTPS)
* **Namespace**: `huntdevops`
* **Replicas**: 2 (Load-balanced across cluster nodes)
* **Features Available**:
  - Interactive DevOps & Cloud incident simulation labs
  - Real-time learning modules (Docker, Kubernetes, GCP, Terraform, CI/CD)
  - Interactive in-browser Linux terminal
  - User registration and progress tracking

### Local Port-Forwarding (Optional Alternative):
```bash
kubectl port-forward svc/huntdevops-frontend -n huntdevops 3000:80
```
Access at: `http://localhost:3000`

---

## 2. ⚙️ Backend REST API (Live on GKE)

The backend provides the RESTful API endpoints for user authentication, activity logging, learning modules, and incident lab validation. It is securely accessible via Traefik at `/api/` or directly inside the cluster.

### 🌐 Live Health Check Endpoints
* 👉 **[https://huntdevops.online/api/health](https://huntdevops.online/api/health)**
* 👉 **[http://136.112.185.77/api/health](http://136.112.185.77/api/health)**

### Test Command:
```bash
curl -i https://huntdevops.online/api/health
```

*Expected JSON Response*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-28T14:47:51.199Z"
}
```

### Key API Endpoints:
| Method | Public URL Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `https://huntdevops.online/api/health` | Service & PostgreSQL database health probe |
| `POST` | `https://huntdevops.online/api/auth/register` | Register a new user |
| `POST` | `https://huntdevops.online/api/auth/login` | Authenticate an existing user |
| `GET` | `https://huntdevops.online/api/topics` | Fetch curriculum learning topics & modules |
| `GET` | `https://huntdevops.online/api/labs` | Fetch interactive incident lab scenarios |

---

## 3. 🐙 Argo CD GitOps Dashboard (Live on GKE)

Argo CD manages declarative deployments on the GKE cluster, continuously synchronizing from [vikranthsunkarpally/huntdevops](https://github.com/vikranth18devops/huntdevops).

### 🌐 Live Dashboard URLs
* **Custom Domain (Recommended)**: 👉 **[https://huntdevops.online/argocd/](https://huntdevops.online/argocd/)** (or `https://huntdevops.online/argocd`)
* **Direct LoadBalancer**: 👉 **[https://136.112.167.2](https://136.112.167.2)**

> [!NOTE]
> * Access via **`https://huntdevops.online/argocd/`** has a valid Let's Encrypt SSL certificate through Traefik and routes with full SPA asset support.
> * When using direct IP access (`https://136.112.167.2`), click **Advanced -> Proceed to 136.112.167.2 (unsafe)** to bypass the self-signed certificate.

### 🔑 Login Credentials
* **Username**: `admin`
* **Password**: `vmvSfJ72EtCyt1oX`

### Retrieve or Verify Password from Cluster:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
```

### Argo CD CLI Login:
```bash
argocd login 136.112.167.2:443 --username admin --password "vmvSfJ72EtCyt1oX" --insecure
argocd app get huntdevops-app
```

---

## 4. 🐘 Google Cloud SQL for PostgreSQL 16 (Enterprise Managed DB)

HuntDevOps runs on a dedicated **Google Cloud SQL for PostgreSQL 16** instance (`prod-huntdevops-psql-2eecc976`) in `us-central1-a` provisioned via Terraform (`module.cloudsql`).

### Connection Endpoints
* **Database Name**: `huntdevops`
* **Admin Username**: `postgres`
* **Admin Password**: `HuntDevOpsCloudSQL2026!`
* **Private IP (VPC Peering)**: `10.154.0.3:5432` (Used by GKE Backend pods)
* **Public IP Address**: `35.232.123.246:5432` (Direct access for pgAdmin / DBeaver)
* **GCP Connection Name**: `project-e746f24e-392a-429f-a4d:us-central1:prod-huntdevops-psql-2eecc976`

### Connecting from Local Machine (pgAdmin 4 / DBeaver / psql)
Because Cloud SQL has Public IP with Authorized Networks enabled, **you can connect directly without port-forwarding**:

```bash
# Direct psql connection:
PGPASSWORD='HuntDevOpsCloudSQL2026!' psql -h 35.232.123.246 -p 5432 -U postgres -d huntdevops
```

In **pgAdmin 4**:
* **Host**: `35.232.123.246`
* **Port**: `5432`
* **Maintenance database**: `huntdevops`
* **Username**: `postgres`
* **Password**: `HuntDevOpsCloudSQL2026!`
* **SSL mode**: `Prefer` / `Allow`

---

## 5. 🔍 Live Cluster Verification Commands

To verify the status of all public load balancers and services at any time:

```bash
# 1. Inspect Traefik external IP (136.112.185.77)
kubectl get svc -n traefik traefik

# 2. Inspect IngressRoutes
kubectl get ingressroute -A

# 3. Verify all pods are running across namespaces
kubectl get pods -n huntdevops
kubectl get pods -n traefik
kubectl get pods -n argocd

# 4. Check persistent volume claim status
kubectl get pvc -n huntdevops
```
