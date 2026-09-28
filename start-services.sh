#!/bin/bash
# start-services.sh - Port-forward HuntDevOps Frontend, Backend, and Argo CD on GKE

echo "=========================================================="
echo "🚀 Establishing Port-Forward Tunnels for HuntDevOps (GKE)"
echo "=========================================================="

# 1. Argo CD Web UI (Port 8080 -> 443)
kubectl port-forward svc/argocd-server -n argocd 8080:443 > /dev/null 2>&1 &
ARGOCD_PID=$!

# 2. Frontend Web UI (Port 3000 -> 80)
kubectl port-forward svc/huntdevops-frontend -n huntdevops 3000:80 > /dev/null 2>&1 &
FRONTEND_PID=$!

# 3. Backend REST API (Port 4000 -> 4000)
kubectl port-forward svc/huntdevops-backend -n huntdevops 4000:4000 > /dev/null 2>&1 &
BACKEND_PID=$!

sleep 2

echo ""
echo "✅ All port-forward tunnels established successfully!"
echo "----------------------------------------------------------"
echo "📱 Frontend Application : http://localhost:3000"
echo "⚙️ Backend REST API      : http://localhost:4000"
echo "🩺 Backend Health Check  : http://localhost:4000/api/health"
echo "🐙 Argo CD GitOps UI     : https://localhost:8080"
echo "   Username              : admin"
echo "   Password              : vmvSfJ72EtCyt1oX"
echo "----------------------------------------------------------"
echo "Press Ctrl+C at any time to close all tunnels."
echo ""

trap "kill $ARGOCD_PID $FRONTEND_PID $BACKEND_PID 2>/dev/null; echo ''; echo '🛑 All port-forward tunnels closed.'; exit 0" INT TERM
wait
