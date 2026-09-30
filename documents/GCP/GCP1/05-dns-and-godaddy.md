# Phase 5 — DNS + Namecheap / GoDaddy Domain Setup (GCP)

**Goal:** Make **HuntDevOps** reachable on the internet via your custom domain name **`huntdevops.online`** instead of a raw public IP address.

**Time:** ~15 minutes (DNS propagation takes 1–10 minutes).

> **Before this phase:** `http://136.112.185.77/` (Raw Traefik GCP Load Balancer IP)  
> **After this phase:** `http://huntdevops.online/` and `http://huntdevops.online/api/health`

---

## ✅ Prerequisites

| Requirement | How to check |
| :--- | :--- |
| **Phase 2 & 4 completed** | App is live and returning HTTP 200 at `http://136.112.185.77` |
| **Registered custom domain** | Domain **`huntdevops.online`** registered on **Namecheap** or **GoDaddy** |
| **DNS diagnostic CLI tools** | `dig` and `nslookup` available on your local terminal (`dig +short google.com`) |

---

## 🛠️ Step 1: Retrieve the GCP Traefik LoadBalancer Public IP

Read the external IP allocated to the **Traefik Ingress Controller** service directly from the GKE cluster:

```bash
LB_IP=$(kubectl -n traefik get svc traefik \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "GCP Traefik LoadBalancer Public IP: ${LB_IP}"
```

*Live Output from Cluster*:
```text
GCP Traefik LoadBalancer Public IP: 136.112.185.77
```

---

## 🌐 Step 2: Add DNS A Records at Namecheap / GoDaddy

### Option A: Namecheap.com
1. Log into your Namecheap console: [https://www.namecheap.com](https://www.namecheap.com)
2. Go to **Domain List** -> Click **MANAGE** next to **`huntdevops.online`**.
3. Select the **Advanced DNS** tab.
4. Under **Host Records**, remove any default parking records and click **ADD NEW RECORD**.

### Option B: GoDaddy.com
1. Log into your GoDaddy DNS console: [https://account.godaddy.com/products](https://account.godaddy.com/products)
2. Locate domain **`huntdevops.online`** and click **DNS** (or **Manage DNS**).
3. Under the **DNS Records** table, click **Add New Record**.

---

### 📋 Required Host Records to Add:

#### Record 1 — Apex Domain (Root URL: `huntdevops.online`)

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `A Record` | Maps hostname to an IPv4 address |
| **Host / Name** | `@` | Root apex domain (`huntdevops.online`) |
| **Value / IP** | `136.112.185.77` | The GCP Traefik Load Balancer IP |
| **TTL** | `Automatic` (or `600` / 10 mins) | Short TTL ensures fast initial propagation |

#### Record 2 — Subdomain (WWW: `www.huntdevops.online`)

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `A Record` (or `CNAME`) | Alias or IPv4 address mapping |
| **Host / Name** | `www` | Becomes `www.huntdevops.online` |
| **Value / IP** | `136.112.185.77` (or `huntdevops.online.`) | Points to apex domain or Traefik IP |
| **TTL** | `Automatic` (or `600`) | 10 minutes |

#### Record 3 — Dedicated Subdomain (Optional)

If you wish to route specific services (e.g. `app.huntdevops.online` or `argo.huntdevops.online`):

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `A Record` | IPv4 address mapping |
| **Host / Name** | `app` (or `argo`) | Becomes `app.huntdevops.online` |
| **Value / IP** | `136.112.185.77` | Same GCP Traefik Load Balancer IP |
| **TTL** | `Automatic` (or `600`) | 10 minutes |

5. Click **Save All Changes** to publish the records.

---

## ⏱️ Step 3: Verify DNS Propagation

DNS propagation across global resolvers typically takes between 1 and 10 minutes. Run these verification commands:

```bash
# Query public DNS servers directly (Google DNS 8.8.8.8 and Cloudflare DNS 1.1.1.1)
dig @8.8.8.8 +short huntdevops.online
dig @1.1.1.1 +short huntdevops.online

# Using nslookup
nslookup huntdevops.online
```

*Expected Output*:
```text
136.112.185.77
```

---

## 🚀 Step 4: Test Application Access via Domain

Once `dig` returns `136.112.185.77`, verify that the Frontend Web UI, Admin Portal, Backend REST API, and Argo CD respond cleanly via `huntdevops.online`:

```bash
# 1. Test Web UI headers
curl -I http://huntdevops.online/

# 2. Test Admin Portal route
curl -I http://huntdevops.online/admin

# 3. Test Backend Health Check through Traefik
curl -s http://huntdevops.online/api/health

# 4. Test Argo CD GitOps Dashboard subpath redirect
curl -ILs http://huntdevops.online/argocd/
```

*Expected JSON Output from API*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-30T14:47:51.199Z"
}
```

Now open **`https://huntdevops.online`** in your web browser to interact with the live application, or **`https://huntdevops.online/argocd/`** to access the Argo CD dashboard!

---

## ⏭️ Next Steps

Now that your application is reachable over HTTP via your custom domain, proceed to:
- 👉 **[06 - Monitoring & Logging Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/06-monitoring-and-logging.md)**: Set up metrics and log aggregation on GKE.
- 👉 **[07 - HTTPS with Let's Encrypt Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-https-letsencrypt-and-routes.md)**: Secure your domain with free automated SSL/TLS certificates via cert-manager.
