# 11 - Application Access URLs, Endpoints & Credentials Guide

This reference document contains the complete **Live Public Internet URLs**, port-forwarding alternatives, API endpoints, service topologies, and administrative credentials for **Frontend**, **Backend**, **PostgreSQL Database**, and the **Argo CD GitOps Dashboard** deployed on Google Kubernetes Engine (GKE).

---

## 🌐 Live Public URLs & Credentials Matrix (Powered by Traefik)

All HTTP traffic is unified behind **Traefik**, exposed via a single Google Cloud Network Load Balancer with dedicated public IP **`136.112.185.77`**.

| Component | Path / Route | Live Public URL | Local Tunnel Alternative | Default Username | Default Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **💻 Frontend Web UI** | `/` (Traefik) | **`http://136.112.185.77/`** | `http://localhost:3000` | N/A (Web UI) | N/A |
| **⚙️ Backend REST API** | `/api/` (Traefik) | **`http://136.112.185.77/api/health`** | `http://localhost:4000/api/health` | N/A (REST API) | N/A |
| **🐙 Argo CD GitOps UI** | `/argocd` (Traefik) | **`http://136.112.185.77/argocd`** | `https://localhost:8080` | `admin` | **`vmvSfJ72EtCyt1oX`** |
| **🐙 Argo CD Direct LB** | `443` (Direct) | **`https://136.112.167.2`** | `https://localhost:8080` | `admin` | **`vmvSfJ72EtCyt1oX`** |
| **🐘 PostgreSQL Database** | `5432` (Internal) | `huntdevops-postgres:5432` | `localhost:5432` | `postgres` | **`HuntDevOpsSecurePassword2026!`** |

---

## 1. 💻 Frontend Application (Live on GKE via Traefik)

The frontend is a dark-mode React TypeScript single-page application served via Nginx and routed by Traefik on Google Kubernetes Engine.

### 🌐 Live Web URL
👉 **[http://136.112.185.77/](http://136.112.185.77/)**

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

The backend provides the RESTful API endpoints for user authentication, activity logging, learning modules, and incident lab validation. It is securely accessible via the frontend Nginx reverse proxy at `/api/` or directly inside the cluster.

### 🌐 Live Health Check Endpoint
👉 **[http://136.112.185.77/api/health](http://136.112.185.77/api/health)**

### Test Command:
```bash
curl -i http://136.112.185.77/api/health
```

*Expected JSON Response*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-28T14:33:33.900Z"
}
```

### Key API Endpoints:
| Method | Public URL Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `http://136.112.185.77/api/health` | Service & PostgreSQL database health probe |
| `POST` | `http://136.112.185.77/api/auth/register` | Register a new user |
| `POST` | `http://136.112.185.77/api/auth/login` | Authenticate an existing user |
| `GET` | `http://136.112.185.77/api/topics` | Fetch curriculum learning topics & modules |
| `GET` | `http://136.112.185.77/api/labs` | Fetch interactive incident lab scenarios |

---

## 3. 🐙 Argo CD GitOps Dashboard (Live on GKE)

Argo CD manages declarative deployments on the GKE cluster, continuously synchronizing from [vikranth18devops/huntdevops](https://github.com/vikranth18devops/huntdevops).

### 🌐 Live Dashboard URLs
* **Via Traefik**: 👉 **[http://136.112.185.77/argocd](http://136.112.185.77/argocd)**
* **Direct LoadBalancer**: 👉 **[https://136.112.167.2](https://136.112.167.2)**

> [!NOTE]
> Because Argo CD generates a self-signed TLS certificate by default, your browser will show a standard certificate warning. Click **Advanced -> Proceed to 136.112.167.2 (unsafe)** to open the login page.

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

## 4. 🐘 PostgreSQL Database (StatefulSet)

PostgreSQL 16 runs as a Kubernetes StatefulSet backed by a 10Gi Google Persistent Disk (`standard-rwo`).

### Connection Details (Internal Cluster DNS)
* **Host**: `huntdevops-postgres.huntdevops.svc.cluster.local` (or `huntdevops-postgres`)
* **Port**: `5432`
* **Database Name**: `huntdevops`
* **Username**: `postgres`
* **Password Secret Name**: `huntdevops-postgres-secret`
* **Password Secret Key**: `postgres-password`
* **Password**: `HuntDevOpsSecurePassword2026!`

### Connecting from Local Machine (psql / DBeaver / TablePlus)
1. Start port-forwarding:
   ```bash
   kubectl port-forward svc/huntdevops-postgres -n huntdevops 5432:5432
   ```

2. Connect using `psql`:
   ```bash
   PGPASSWORD='HuntDevOpsSecurePassword2026!' psql -h localhost -p 5432 -U postgres -d huntdevops
   ```

3. Connect directly inside the pod:
   ```bash
   kubectl exec -it huntdevops-postgres-0 -n huntdevops -- psql -U postgres -d huntdevops
   ```

---

## 5. 🔍 Live Cluster Verification Commands

To verify the status of all public load balancers and services at any time:

```bash
# 1. Inspect public Load Balancer external IPs
kubectl get svc -n huntdevops huntdevops-frontend
kubectl get svc -n argocd argocd-server

# 2. Verify all pods are running across namespaces
kubectl get pods -n huntdevops
kubectl get pods -n argocd

# 3. Check persistent volume claim status
kubectl get pvc -n huntdevops
```
