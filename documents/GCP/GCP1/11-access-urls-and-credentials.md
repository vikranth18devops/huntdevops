# 11 - Application Access URLs, Endpoints & Credentials Guide

This reference document contains the complete access URLs, port-forwarding instructions, API endpoints, service topologies, and administrative credentials for **Frontend**, **Backend**, **PostgreSQL Database**, and the **Argo CD GitOps Dashboard** deployed on Google Kubernetes Engine (GKE).

---

## 📋 Quick Credentials & Access Summary

| Component | In-Cluster Service | Port | Local Access URL | Default Username | Default Password / Secret |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Argo CD UI** | `argocd-server.argocd` | `443` | `https://localhost:8080` | `admin` | `vmvSfJ72EtCyt1oX` |
| **Frontend UI** | `huntdevops-frontend.huntdevops` | `80` | `http://localhost:3000` | N/A (Web UI) | N/A |
| **Backend REST API** | `huntdevops-backend.huntdevops` | `4000` | `http://localhost:4000` | N/A (REST API) | N/A |
| **PostgreSQL Database** | `huntdevops-postgres.huntdevops` | `5432` | `localhost:5432` | `postgres` | `HuntDevOpsSecurePassword2026!` |

---

## 1. 🐙 Argo CD GitOps Dashboard

Argo CD manages declarative deployments on the GKE cluster.

### Access Commands
Run the port-forward command from your terminal:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Access URL & Credentials
* **URL**: [https://localhost:8080](https://localhost:8080)
* **Username**: `admin`
* **Password**: `vmvSfJ72EtCyt1oX`

> [!TIP]
> If the password was ever reset or rotated, you can retrieve the current initial admin password at any time using:
> ```bash
> kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
> ```

### Argo CD CLI Login (Optional)
```bash
# Login via CLI
argocd login localhost:8080 --username admin --password "vmvSfJ72EtCyt1oX" --insecure

# Check application status
argocd app get huntdevops-app
```

---

## 2. 💻 Frontend Application (React TypeScript SPA)

The frontend is a dark-mode React TypeScript single-page application served via an Nginx web server.

### Access Commands
Run the port-forward command from your terminal:
```bash
kubectl port-forward svc/huntdevops-frontend -n huntdevops 3000:80
```

### Access URL
* **URL**: [http://localhost:3000](http://localhost:3000)
* **Namespace**: `huntdevops`
* **Replicas**: 2 (Load-balanced across cluster nodes)
* **Features Available**:
  - Interactive DevOps & Cloud incident simulation labs
  - Real-time learning modules (Docker, Kubernetes, GCP, Terraform, CI/CD)
  - Interactive in-browser Linux terminal
  - User registration and progress tracking

---

## 3. ⚙️ Backend REST API (Express Node.js)

The backend provides the RESTful API endpoints for user authentication, activity logging, learning modules, and incident lab validation.

### Access Commands
Run the port-forward command from your terminal:
```bash
kubectl port-forward svc/huntdevops-backend -n huntdevops 4000:4000
```

### Access URL & Endpoints
* **Base URL**: [http://localhost:4000](http://localhost:4000)
* **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

### Verification via cURL:
```bash
# Verify API Health and DB Connection
curl -i http://localhost:4000/api/health
```

*Expected JSON Response*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-28T13:54:12.771Z"
}
```

### Key API Endpoints:
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health probe returning service & database status |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate an existing user |
| `GET` | `/api/topics` | Fetch curriculum learning topics & modules |
| `GET` | `/api/labs` | Fetch interactive incident lab scenarios |

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

### Connecting from Local Machine (psql / DBeaver / pgAdmin)
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

### Database Tables Auto-Created:
* `users`: Registered users, display names, and roles
* `topics`: Curriculum modules and study guides
* `incident_labs`: Interactive lab scenarios and tasks
* `user_completions`: Question completion records
* `user_lab_solutions`: Completed incident lab tracking
* `activity_logs`: User activity and device session logs

---

## 5. 🌐 One-Command Multi-Service Port-Forwarding Script

To open access to **all 3 services** simultaneously in the background, you can run this script:

```bash
#!/bin/bash
# start-all-services.sh

echo "🚀 Starting port-forwards for HuntDevOps on GKE..."

# 1. Argo CD Web UI (Port 8080 -> 443)
kubectl port-forward svc/argocd-server -n argocd 8080:443 > /dev/null 2>&1 &
ARGOCD_PID=$!

# 2. Frontend Web UI (Port 3000 -> 80)
kubectl port-forward svc/huntdevops-frontend -n huntdevops 3000:80 > /dev/null 2>&1 &
FRONTEND_PID=$!

# 3. Backend REST API (Port 4000 -> 4000)
kubectl port-forward svc/huntdevops-backend -n huntdevops 4000:4000 > /dev/null 2>&1 &
BACKEND_PID=$!

echo "✅ All port-forward tunnels established!"
echo ""
echo "📱 Frontend:    http://localhost:3000"
echo "⚙️ Backend API: http://localhost:4000/api/health"
echo "🐙 Argo CD:     https://localhost:8080 (User: admin | Pass: vmvSfJ72EtCyt1oX)"
echo ""
echo "Press Ctrl+C to terminate all tunnels..."

trap "kill $ARGOCD_PID $FRONTEND_PID $BACKEND_PID; echo 'Tunnels closed.'; exit" INT
wait
```

---

## 6. 🔒 Security Best Practices for Production

1. **Rotate the Argo CD Admin Password**:
   After your initial login, update the admin password:
   ```bash
   argocd account update-password
   ```
2. **Ingress and TLS/SSL**:
   In production with a registered domain name, attach a Google Cloud Load Balancer with Google-managed SSL certificates to route traffic securely over HTTPS (`port 443`).
3. **Database Secrets**:
   The database secret `huntdevops-postgres-secret` is stored in Kubernetes. In advanced production setups, integrate with **Google Cloud Secret Manager** or **HashiCorp Vault** using External Secrets Operator (ESO).
