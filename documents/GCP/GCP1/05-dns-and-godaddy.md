# Phase 5 — DNS + GoDaddy Domain Setup (GCP)

**Goal:** Make **HuntDevOps** reachable on the internet via your custom domain name **`vikranthsunkarpally.in`** instead of a raw public IP address.

**Time:** ~15 minutes (DNS propagation takes 2–10 minutes).

> **Before this phase:** `http://136.112.185.77/` (Raw Traefik GCP Load Balancer IP)  
> **After this phase:** `http://vikranthsunkarpally.in/` and `http://vikranthsunkarpally.in/api/health`

---

## ✅ Prerequisites

| Requirement | How to check |
| :--- | :--- |
| **Phase 2 & 4 completed** | App is live and returning HTTP 200 at `http://136.112.185.77` |
| **Registered custom domain** | Domain **`vikranthsunkarpally.in`** registered on **GoDaddy** |
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

## 🌐 Step 2: Add DNS A Records at GoDaddy

1. Log into your GoDaddy DNS console: [https://account.godaddy.com/products](https://account.godaddy.com/products)
2. Locate domain **`vikranthsunkarpally.in`** and click **DNS** (or **Manage DNS**).
3. Under the **DNS Records** table, click **Add New Record**.
4. Configure the primary records pointing to the Traefik Load Balancer IP:

### Record 1 — Apex Domain (Root URL)

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `A` | Maps hostname to an IPv4 address |
| **Name** | `@` | Root apex domain (`vikranthsunkarpally.in`) |
| **Value** | `136.112.185.77` | The GCP Traefik Load Balancer IP |
| **TTL** | `600` (10 minutes) | Short TTL ensures fast initial propagation |

### Record 2 — Subdomain (WWW)

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `CNAME` or `A` | Alias or IPv4 address mapping |
| **Name** | `www` | Becomes `www.vikranthsunkarpally.in` |
| **Value** | `vikranthsunkarpally.in` (for CNAME) or `136.112.185.77` (for A) | Points to apex domain or Traefik IP |
| **TTL** | `600` | 10 minutes |

### Record 3 — Dedicated App Subdomain (Optional)

If you wish to route specific services (e.g. `app.vikranthsunkarpally.in` or `argo.vikranthsunkarpally.in`):

| Field | Value | Explanation |
| :--- | :--- | :--- |
| **Type** | `A` | IPv4 address mapping |
| **Name** | `huntdevops` (or `app`) | Becomes `huntdevops.vikranthsunkarpally.in` |
| **Value** | `136.112.185.77` | Same GCP Traefik Load Balancer IP |
| **TTL** | `600` | 10 minutes |

5. Click **Save** to publish the records.

---

## ⏱️ Step 3: Verify DNS Propagation

DNS propagation across global resolvers typically takes between 1 and 10 minutes. Run these verification commands:

```bash
# Query public DNS servers directly (Google DNS 8.8.8.8 and Cloudflare DNS 1.1.1.1)
dig @8.8.8.8 +short vikranthsunkarpally.in
dig @1.1.1.1 +short vikranthsunkarpally.in

# Using nslookup
nslookup vikranthsunkarpally.in
```

*Expected Output*:
```text
136.112.185.77
```

---

## 🚀 Step 4: Test Application Access via Domain

Once `dig` returns `136.112.185.77`, verify that both the Frontend Web UI, Backend REST API, and Argo CD respond cleanly via `vikranthsunkarpally.in`:

```bash
# 1. Test Web UI headers
curl -I http://vikranthsunkarpally.in/

# 2. Test Backend Health Check through Traefik
curl -s http://vikranthsunkarpally.in/api/health

# 3. Test Argo CD GitOps Dashboard redirect
curl -I http://vikranthsunkarpally.in/argocd
```

*Expected JSON Output from API*:
```json
{
  "status": "online",
  "database": "PostgreSQL (Connected)",
  "timestamp": "2026-09-28T14:47:51.199Z"
}
```

Now open **`http://vikranthsunkarpally.in`** in your web browser to interact with the live application!

---

## ⏭️ Next Steps

Now that your application is reachable over HTTP via your custom domain, proceed to:
- 👉 **[06 - Monitoring & Logging Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/06-monitoring-and-logging.md)**: Set up metrics and log aggregation on GKE.
- 👉 **[07 - HTTPS with Let's Encrypt Guide](file:///Users/aarvik/Documents/huntdevops/documents/GCP/GCP1/07-https-letsencrypt-and-routes.md)**: Secure your domain with free automated SSL/TLS certificates via cert-manager.
