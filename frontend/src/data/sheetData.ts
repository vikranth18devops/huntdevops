export interface ChoiceOption {
  id: string;
  text: string;
}

export interface CommandItem {
  id: string;
  label: string;
  command?: string;
  why?: string;
  options?: ChoiceOption[];
  correctOptionId?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export function getItemExperienceLevel(item: CommandItem, index: number = 0): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (item.level) return item.level;
  const keyStr = item.id || item.label || String(index);
  let hash = 0;
  for (let i = 0; i < keyStr.length; i++) {
    hash = (hash << 5) - hash + keyStr.charCodeAt(i);
    hash |= 0;
  }
  const mod = Math.abs(hash) % 3;
  if (mod === 0) return 'Beginner';
  if (mod === 1) return 'Intermediate';
  return 'Advanced';
}

export interface CommandGroup {
  title: string;
  items: CommandItem[];
}

export interface Section {
  id: string;
  title: string;
  commands: CommandGroup[];
  disabled?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  sections: Section[];
  disabled?: boolean;
}

export const TOPICS: Topic[] = [
  {
    "id": "argocd",
    "title": "Argo CD",
    "subtitle": "GitOps principles & Kubernetes continuous delivery.",
    "sections": [
      {
        "id": "gitops-foundations",
        "title": "GitOps principles",
        "commands": [
          {
            "title": "Core Pillars",
            "items": [
              {
                "id": "go-1",
                "label": "Declarative Specifications",
                "command": "kubectl apply -k overlays/production",
                "why": "Entire environment state defined declaratively in Git."
              },
              {
                "id": "go-2",
                "label": "Automated Drift Reconciliation",
                "command": "argocd app sync --async --prune",
                "why": "Software agents continuously compare live cluster state to Git state and fix drift."
              },
              {
                "id": "go-3",
                "label": "Git Versioned Immutability",
                "command": "git rev-parse --verify HEAD",
                "why": "All deployments and state changes are version-controlled, auditable, and rollback-ready in Git."
              }
            ]
          }
        ]
      },
      {
        "id": "argo-apps",
        "title": "Applications & sync",
        "commands": [
          {
            "title": "CLI & Manifests",
            "items": [
              {
                "id": "argo-1",
                "label": "argocd app list",
                "command": "argocd app list",
                "why": "Lists all deployed applications and sync health statuses."
              },
              {
                "id": "argo-2",
                "label": "argocd app sync <app-name>",
                "command": "argocd app sync <app-name>",
                "why": "Triggers manual sync from Git repository to cluster."
              },
              {
                "id": "argo-3",
                "label": "Automated Sync Policy",
                "command": "syncPolicy:\n  automated:\n    prune: true\n    selfHeal: true",
                "why": "Configures automatic resource pruning and drift self-healing."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "aws",
    "title": "AWS",
    "subtitle": "Build, deploy & scale on Amazon Web Services.",
    "sections": [
      {
        "id": "aws-compute",
        "title": "Compute & Containers",
        "commands": [
          {
            "title": "EC2 & ECS Management",
            "items": [
              {
                "id": "aws-ec2-1",
                "label": "aws ec2 run-instances",
                "command": "aws ec2 run-instances --image-id ami-0c55b159cbfafe1f0 --instance-type t3.micro --key-name prod-key",
                "why": "Launches new EC2 virtual machine instance in Amazon VPC."
              },
              {
                "id": "aws-ecs-1",
                "label": "aws ecs update-service",
                "command": "aws ecs update-service --cluster prod-cluster --service api-svc --force-new-deployment",
                "why": "Triggers rolling container update on ECS service task definition."
              },
              {
                "id": "aws-lambda-1",
                "label": "aws lambda invoke",
                "command": "aws lambda invoke --function-name process-order --payload '{\"id\": 101}' response.json",
                "why": "Executes serverless Lambda function synchronously and writes response payload."
              }
            ]
          }
        ]
      },
      {
        "id": "aws-storage-db",
        "title": "Storage & Databases",
        "commands": [
          {
            "title": "S3 & RDS Operations",
            "items": [
              {
                "id": "aws-s3-1",
                "label": "aws s3 sync",
                "command": "aws s3 sync ./dist s3://my-prod-bucket/app --delete",
                "why": "Synchronizes local frontend build to S3 bucket, pruning obsolete files."
              },
              {
                "id": "aws-rds-1",
                "label": "aws rds create-db-snapshot",
                "command": "aws rds create-db-snapshot --db-instance-identifier prod-db --db-snapshot-identifier snap-01",
                "why": "Creates manual point-in-time backup snapshot of RDS database instance."
              },
              {
                "id": "aws-dynamo-1",
                "label": "aws dynamodb describe-table",
                "command": "aws dynamodb describe-table --table-name user-sessions --query 'Table.TableStatus'",
                "why": "Inspects status, provisioned capacity, and partition keys for NoSQL DynamoDB tables."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "azure",
    "title": "Azure",
    "subtitle": "Enterprise cloud services & hybrid infrastructure.",
    "sections": [
      {
        "id": "azure-compute",
        "title": "VM & AKS Management",
        "commands": [
          {
            "title": "Compute & Kubernetes",
            "items": [
              {
                "id": "az-vm-1",
                "label": "az vm create",
                "command": "az vm create --resource-group rg-prod --name vm-app --image Ubuntu2204 --admin-username azureuser",
                "why": "Provisions Ubuntu virtual machine inside Azure Resource Group."
              },
              {
                "id": "az-aks-1",
                "label": "az aks get-credentials",
                "command": "az aks get-credentials --resource-group rg-prod --name aks-cluster",
                "why": "Downloads kubeconfig credentials for Azure Kubernetes Service."
              },
              {
                "id": "az-aks-scale",
                "label": "az aks scale",
                "command": "az aks scale --resource-group rg-prod --name aks-cluster --node-count 5",
                "why": "Scales the worker node pool of an Azure Kubernetes Service (AKS) cluster to meet workload demand."
              }
            ]
          }
        ]
      },
      {
        "id": "azure-resources",
        "title": "Resource Groups & Storage",
        "commands": [
          {
            "title": "Resource Management",
            "items": [
              {
                "id": "az-rg-1",
                "label": "az group create",
                "command": "az group create --name rg-production --location eastus",
                "why": "Creates logical resource group container in East US region."
              },
              {
                "id": "az-storage-1",
                "label": "az storage blob upload-batch",
                "command": "az storage blob upload-batch --destination $web --source ./build --account-name mystorageacct",
                "why": "Uploads static site build artifacts to Azure Storage container."
              },
              {
                "id": "az-acr-1",
                "label": "az acr build",
                "command": "az acr build --registry myregistry --image huntdevops/app:v1 .",
                "why": "Builds and pushes a container image directly in Azure Container Registry without local Docker engine."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cicd",
    "title": "CI / CD",
    "subtitle": "Turn a change into a reliable release.",
    "sections": [
      {
        "id": "cicd-strategy",
        "title": "Pipeline fundamentals",
        "commands": [
          {
            "title": "Release Strategies",
            "items": [
              {
                "id": "cicd-1",
                "label": "Trunk-Based Development",
                "command": "git merge --no-ff feature/api-v2",
                "why": "Short-lived feature branches merged frequently to main branch to avoid integration hell."
              },
              {
                "id": "cicd-2",
                "label": "Blue / Green Deployment",
                "command": "kubectl set selector service/app app=v2",
                "why": "Two identical production environments: switches router traffic instantly with zero downtime."
              },
              {
                "id": "cicd-3",
                "label": "Canary Releases",
                "command": "flagger set weight --app=api 5%",
                "why": "Routes 5% of user traffic to new version, monitoring errors before full 100% rollout."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "docker",
    "title": "Docker",
    "subtitle": "Package once. Run consistently.",
    "sections": [
      {
        "id": "docker-ops",
        "title": "Container management",
        "commands": [
          {
            "title": "Run & Inspect",
            "items": [
              {
                "id": "docker-1",
                "label": "docker run -d -p 8080:80 --name web nginx:alpine",
                "command": "docker run -d -p 8080:80 --name web nginx:alpine",
                "why": "Runs container detached in background mapping host port 8080 to container port 80."
              },
              {
                "id": "docker-2",
                "label": "docker ps -a",
                "command": "docker ps -a",
                "why": "Lists all active and stopped containers."
              },
              {
                "id": "docker-3",
                "label": "docker logs --tail 100 -f web",
                "command": "docker logs --tail 100 -f web",
                "why": "Streams live container stdout/stderr logs."
              },
              {
                "id": "docker-4",
                "label": "docker exec -it web sh",
                "command": "docker exec -it web sh",
                "why": "Opens interactive shell inside running container."
              }
            ]
          },
          {
            "title": "Images & Cleanup",
            "items": [
              {
                "id": "docker-img-1",
                "label": "docker build -t myapp:1.0 .",
                "command": "docker build -t myapp:1.0 .",
                "why": "Builds Docker image tagged myapp:1.0 from current directory Dockerfile."
              },
              {
                "id": "docker-img-2",
                "label": "docker system prune -af --volumes",
                "command": "docker system prune -af --volumes",
                "why": "Reclaims disk space by removing unused containers, networks, images, and volumes."
              }
            ]
          }
        ]
      },
      {
        "id": "docker-compose",
        "title": "Compose & Orchestration",
        "commands": [
          {
            "title": "Docker Compose Workflow",
            "items": [
              {
                "id": "dc-1",
                "label": "docker compose up -d",
                "command": "docker compose up -d",
                "why": "Builds, creates, and starts all services defined in compose.yaml in background."
              },
              {
                "id": "dc-2",
                "label": "docker compose down -v",
                "command": "docker compose down -v",
                "why": "Stops containers and removes named persistent storage volumes."
              },
              {
                "id": "dc-3",
                "label": "docker compose logs -f api",
                "command": "docker compose logs -f api",
                "why": "Streams logs for specific compose service 'api'."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "gcp",
    "title": "GCP",
    "subtitle": "Data, GKE & Google Cloud Infrastructure.",
    "sections": [
      {
        "id": "gcp-compute",
        "title": "GKE & Compute Engine",
        "commands": [
          {
            "title": "Kubernetes & VMs",
            "items": [
              {
                "id": "gcloud-gke-1",
                "label": "gcloud container clusters get-credentials",
                "command": "gcloud container clusters get-credentials prod-cluster --region us-central1",
                "why": "Fetches cluster authentication credentials for GKE cluster management via kubectl."
              },
              {
                "id": "gcloud-vm-1",
                "label": "gcloud compute instances create",
                "command": "gcloud compute instances create app-node-1 --zone us-central1-a --machine-type e2-standard-2",
                "why": "Provisions Compute Engine virtual machine instance."
              },
              {
                "id": "gcloud-gke-resize",
                "label": "gcloud container clusters resize",
                "command": "gcloud container clusters resize huntdevops-gke --node-pool default-pool --num-nodes 3 --region us-central1",
                "why": "Dynamically resizes GKE cluster node pool capacity to balance cost and workload demands."
              }
            ]
          }
        ]
      },
      {
        "id": "gcp-storage",
        "title": "Cloud Storage & IAM",
        "commands": [
          {
            "title": "Buckets & Service Accounts",
            "items": [
              {
                "id": "gcp-gsutil-1",
                "label": "gsutil rsync",
                "command": "gsutil rsync -r ./assets gs://my-app-bucket/assets",
                "why": "Synchronizes local assets directory recursively to Google Cloud Storage bucket."
              },
              {
                "id": "gcp-iam-1",
                "label": "gcloud projects add-iam-policy-binding",
                "command": "gcloud projects add-iam-policy-binding my-project --member serviceAccount:sa@my-project.iam.gserviceaccount.com --role roles/storage.objectAdmin",
                "why": "Binds IAM role permissions to Google Cloud service account."
              },
              {
                "id": "gcp-secret-1",
                "label": "gcloud secrets versions access",
                "command": "gcloud secrets versions access latest --secret=database-url",
                "why": "Fetches secure environment secrets and API credentials securely from Google Secret Manager."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "git",
    "title": "Git / GitHub",
    "subtitle": "Track changes. Work together.",
    "sections": [
      {
        "id": "git-workflow",
        "title": "Local workflow",
        "commands": [
          {
            "title": "Status & Staging",
            "items": [
              {
                "id": "git-1",
                "label": "git status -s",
                "command": "git status -s",
                "why": "Short-format status overview of modified, untracked, and staged files."
              },
              {
                "id": "git-2",
                "label": "git add -p",
                "command": "git add -p",
                "why": "Interactively stages code changes chunk by chunk (hunks)."
              },
              {
                "id": "git-3",
                "label": "git commit -m 'feat: description'",
                "command": "git commit -m 'feat: description'",
                "why": "Creates commit with conventional feat/fix message."
              }
            ]
          },
          {
            "title": "Diff & Inspection",
            "items": [
              {
                "id": "git-diff-1",
                "label": "git diff --staged",
                "command": "git diff --staged",
                "why": "Displays exact code differences staged for next commit."
              },
              {
                "id": "git-log-1",
                "label": "git log --oneline --graph -n 10",
                "command": "git log --oneline --graph -n 10",
                "why": "Renders visual branch commit graph."
              }
            ]
          }
        ]
      },
      {
        "id": "git-advanced",
        "title": "Branches & recovery",
        "commands": [
          {
            "title": "Branch Operations",
            "items": [
              {
                "id": "git-br-1",
                "label": "git checkout -b feature/auth",
                "command": "git checkout -b feature/auth",
                "why": "Creates and switches to a new branch."
              },
              {
                "id": "git-br-2",
                "label": "git rebase main",
                "command": "git rebase main",
                "why": "Applies current feature commits on top of latest main branch."
              }
            ]
          },
          {
            "title": "History & Undo",
            "items": [
              {
                "id": "git-rec-1",
                "label": "git reflog",
                "command": "git reflog",
                "why": "Lists all HEAD pointer movements, allowing recovery of lost or reset commits."
              },
              {
                "id": "git-rec-2",
                "label": "git reset --soft HEAD~1",
                "command": "git reset --soft HEAD~1",
                "why": "Undoes last commit while keeping code changes staged."
              },
              {
                "id": "git-rec-3",
                "label": "git stash push -m 'wip'",
                "command": "git stash push -m 'wip'",
                "why": "Saves uncommitted working directory changes to stash stack."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "github-actions",
    "title": "GitHub Actions",
    "subtitle": "Automate inside your repository.",
    "sections": [
      {
        "id": "gha-workflows",
        "title": "Workflow essentials",
        "commands": [
          {
            "title": "Triggers & Actions",
            "items": [
              {
                "id": "gha-1",
                "label": "on: [push, pull_request]",
                "command": "on:\n  push:\n    branches: [main]",
                "why": "Triggers workflow runs on push to main branch."
              },
              {
                "id": "gha-2",
                "label": "uses: actions/checkout@v4",
                "command": "- uses: actions/checkout@v4",
                "why": "Checks out repository code onto runner."
              },
              {
                "id": "gha-3",
                "label": "uses: docker/build-push-action@v5",
                "command": "- uses: docker/build-push-action@v5\n  with:\n    push: true\n    tags: ghcr.io/${{ github.repository }}:latest",
                "why": "Builds and pushes image to GitHub Container Registry."
              },
              {
                "id": "gha-4",
                "label": "permissions: packages: write",
                "command": "permissions:\n  packages: write",
                "why": "Grants GITHUB_TOKEN permissions to publish images to GHCR."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "jenkins",
    "title": "Jenkins",
    "subtitle": "Build pipelines as code.",
    "sections": [
      {
        "id": "jenkins-pipe",
        "title": "Pipeline as code",
        "commands": [
          {
            "title": "Jenkinsfile Declarative Syntax",
            "items": [
              {
                "id": "jenk-1",
                "label": "pipeline { agent any ... }",
                "command": "pipeline {\n  agent any\n  stages {\n    stage('Build') {\n      steps { sh 'npm ci' }\n    }\n  }\n}",
                "why": "Standard declarative pipeline structure."
              },
              {
                "id": "jenk-2",
                "label": "post { always { cleanWs() } }",
                "command": "post {\n  always {\n    cleanWs()\n  }\n}",
                "why": "Ensures workspace directory cleanup after build completes."
              },
              {
                "id": "jenk-3",
                "label": "post { failure { slackSend ... } }",
                "command": "post {\n  failure {\n    slackSend channel: '#devops-alerts', message: 'Build Failed!'\n  }\n}",
                "why": "Executes notification alerts to Slack team channels immediately upon pipeline failure."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "kubernetes",
    "title": "Kubernetes",
    "subtitle": "Run and manage container workloads.",
    "sections": [
      {
        "id": "k8s-fundamentals",
        "title": "Cluster fundamentals",
        "commands": [
          {
            "title": "Cluster Inspection",
            "items": [
              {
                "id": "k8s-1",
                "label": "kubectl get pods -A -o wide",
                "command": "kubectl get pods -A -o wide",
                "why": "Lists all pods across all namespaces with Node assignments and Pod IPs."
              },
              {
                "id": "k8s-2",
                "label": "kubectl describe pod <pod-name>",
                "command": "kubectl describe pod <pod-name>",
                "why": "Displays low-level pod events, readiness probes, and container status."
              },
              {
                "id": "k8s-3",
                "label": "kubectl logs -f -l app=backend --tail=100",
                "command": "kubectl logs -f -l app=backend --tail=100",
                "why": "Follows logs across all pods matching label `app=backend`."
              }
            ]
          },
          {
            "title": "Debugging & Execution",
            "items": [
              {
                "id": "k8s-dbg-1",
                "label": "kubectl exec -it <pod-name> -- sh",
                "command": "kubectl exec -it <pod-name> -- sh",
                "why": "Opens interactive shell in container."
              },
              {
                "id": "k8s-dbg-2",
                "label": "kubectl port-forward svc/my-service 8080:80",
                "command": "kubectl port-forward svc/my-service 8080:80",
                "why": "Forwards local port 8080 directly to cluster service."
              },
              {
                "id": "k8s-dbg-3",
                "label": "kubectl get events --sort-by='.metadata.creationTimestamp'",
                "command": "kubectl get events --sort-by='.metadata.creationTimestamp'",
                "why": "Lists recent cluster warnings, OOMKills, and scheduling failures."
              }
            ]
          }
        ]
      },
      {
        "id": "k8s-workloads",
        "title": "Workloads & Manifests",
        "commands": [
          {
            "title": "Deployments & Rollouts",
            "items": [
              {
                "id": "k8s-dep-1",
                "label": "kubectl apply -f deployment.yaml",
                "command": "kubectl apply -f deployment.yaml",
                "why": "Declaratively applies configuration changes."
              },
              {
                "id": "k8s-dep-2",
                "label": "kubectl rollout status deployment/web",
                "command": "kubectl rollout status deployment/web",
                "why": "Monitors rolling deployment update status."
              },
              {
                "id": "k8s-dep-3",
                "label": "kubectl rollout undo deployment/web",
                "command": "kubectl rollout undo deployment/web",
                "why": "Rolls back deployment to previous revision immediately."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "linux",
    "title": "Linux",
    "subtitle": "The foundation of every server.",
    "sections": [
      {
        "id": "file-mgmt",
        "title": "File & folder management",
        "commands": [
          {
            "title": "Directory Listing",
            "items": [
              {
                "id": "linux-ls-1",
                "label": "ls -la",
                "command": "ls -la",
                "why": "Lists all files including hidden ones (.dotfiles) with long format permissions, owner, and size."
              },
              {
                "id": "linux-ls-2",
                "label": "ls -lh",
                "command": "ls -lh",
                "why": "Shows file sizes in human-readable format (K, M, G) for quick disk inspection."
              },
              {
                "id": "linux-ls-3",
                "label": "ls -ltr",
                "command": "ls -ltr",
                "why": "Sorts files by modification time in reverse (newest files appear at the bottom)."
              },
              {
                "id": "linux-ls-4",
                "label": "tree -L 2",
                "command": "tree -L 2",
                "why": "Displays directory tree structure up to 2 levels deep."
              }
            ]
          },
          {
            "title": "Navigation & Paths",
            "items": [
              {
                "id": "linux-nav-1",
                "label": "pwd",
                "command": "pwd",
                "why": "Prints absolute current working directory path."
              },
              {
                "id": "linux-nav-2",
                "label": "cd -",
                "command": "cd -",
                "why": "Switches back to the previous working directory."
              },
              {
                "id": "linux-nav-3",
                "label": "cd ~",
                "command": "cd ~",
                "why": "Navigates directly to the logged-in user's home directory."
              }
            ]
          },
          {
            "title": "Create & Remove",
            "items": [
              {
                "id": "linux-cr-1",
                "label": "mkdir -p path/to/dir",
                "command": "mkdir -p path/to/dir",
                "why": "Creates nested directories without failing if parent folders do not exist."
              },
              {
                "id": "linux-cr-2",
                "label": "rm -rf dir/",
                "command": "rm -rf dir/",
                "why": "Forcefully and recursively deletes a directory and all contained files."
              },
              {
                "id": "linux-cr-3",
                "label": "touch file.txt",
                "command": "touch file.txt",
                "why": "Creates an empty file or updates access/modification timestamp."
              }
            ]
          },
          {
            "title": "Find Files",
            "items": [
              {
                "id": "linux-find-1",
                "label": "find . -name '*.log'",
                "command": "find . -name '*.log'",
                "why": "Searches for all files matching .log extension starting from current directory."
              },
              {
                "id": "linux-find-2",
                "label": "find /var/log -type f -mtime -1",
                "command": "find /var/log -type f -mtime -1",
                "why": "Finds log files modified within the last 24 hours."
              },
              {
                "id": "linux-find-3",
                "label": "find . -type f -size +100M",
                "command": "find . -type f -size +100M",
                "why": "Locates large files exceeding 100 megabytes to clean disk space."
              }
            ]
          }
        ]
      },
      {
        "id": "text-proc",
        "title": "Read & process text",
        "commands": [
          {
            "title": "Read Files",
            "items": [
              {
                "id": "linux-read-1",
                "label": "cat app.log",
                "command": "cat app.log",
                "why": "Outputs entire file content to stdout."
              },
              {
                "id": "linux-read-2",
                "label": "less app.log",
                "command": "less app.log",
                "why": "Opens interactive view allowing forward/backward scrolling without loading entire file to memory."
              },
              {
                "id": "linux-read-3",
                "label": "tail -f -n 100 app.log",
                "command": "tail -f -n 100 app.log",
                "why": "Streams last 100 lines and follows live log output in real time."
              },
              {
                "id": "linux-read-4",
                "label": "head -n 20 config.yaml",
                "command": "head -n 20 config.yaml",
                "why": "Prints first 20 lines of a configuration file."
              }
            ]
          },
          {
            "title": "Filter & Transform",
            "items": [
              {
                "id": "linux-grep-1",
                "label": "grep -i 'error' app.log",
                "command": "grep -i 'error' app.log",
                "why": "Case-insensitive search for string 'error' in log file."
              },
              {
                "id": "linux-grep-2",
                "label": "grep -rnw '/etc/' -e 'DEBUG'",
                "command": "grep -rnw '/etc/' -e 'DEBUG'",
                "why": "Recursively searches directory for exact word match with line numbers."
              },
              {
                "id": "linux-awk-1",
                "label": "awk '{print $1, $4}' access.log",
                "command": "awk '{print $1, $4}' access.log",
                "why": "Extracts specific columns (e.g. client IP and timestamp) from space-delimited web logs."
              },
              {
                "id": "linux-sed-1",
                "label": "sed -i 's/HTTP/HTTPS/g' config.txt",
                "command": "sed -i 's/HTTP/HTTPS/g' config.txt",
                "why": "In-place string replacement across entire configuration file."
              }
            ]
          }
        ]
      },
      {
        "id": "users-perm",
        "title": "Users & permissions",
        "commands": [
          {
            "title": "Permissions & Ownership",
            "items": [
              {
                "id": "linux-perm-1",
                "label": "chmod +x script.sh",
                "command": "chmod +x script.sh",
                "why": "Adds execute permissions for current user, group, and others."
              },
              {
                "id": "linux-perm-2",
                "label": "chmod 600 id_rsa",
                "command": "chmod 600 id_rsa",
                "why": "Restricts SSH private key permissions to read/write for owner only (required by SSH client)."
              },
              {
                "id": "linux-perm-3",
                "label": "chmod 755 binary",
                "command": "chmod 755 binary",
                "why": "Sets owner rwx, group r-x, others r-x permissions."
              },
              {
                "id": "linux-perm-4",
                "label": "chown -R deploy:ops /var/www",
                "command": "chown -R deploy:ops /var/www",
                "why": "Recursively changes user ownership to 'deploy' and group to 'ops'."
              }
            ]
          },
          {
            "title": "User Management",
            "items": [
              {
                "id": "linux-usr-1",
                "label": "sudo useradd -m -s /bin/bash appuser",
                "command": "sudo useradd -m -s /bin/bash appuser",
                "why": "Creates user with home directory and default bash shell."
              },
              {
                "id": "linux-usr-2",
                "label": "usermod -aG docker appuser",
                "command": "usermod -aG docker appuser",
                "why": "Appends user to 'docker' group without overwriting existing group memberships."
              },
              {
                "id": "linux-usr-3",
                "label": "id appuser",
                "command": "id appuser",
                "why": "Displays UID, GID, and group memberships for a user account."
              }
            ]
          }
        ]
      },
      {
        "id": "proc-services",
        "title": "Processes & services",
        "commands": [
          {
            "title": "Process Inspection",
            "items": [
              {
                "id": "linux-proc-1",
                "label": "ps aux | grep node",
                "command": "ps aux | grep node",
                "why": "Finds running Node.js process IDs, memory usage, and execution commands."
              },
              {
                "id": "linux-proc-2",
                "label": "top / htop",
                "command": "htop",
                "why": "Interactive real-time process monitoring for CPU, RAM, and load averages."
              },
              {
                "id": "linux-proc-3",
                "label": "kill -9 <PID>",
                "command": "kill -9 <PID>",
                "why": "Sends SIGKILL signal to immediately terminate stuck process."
              }
            ]
          },
          {
            "title": "Systemd Services",
            "items": [
              {
                "id": "linux-sys-1",
                "label": "systemctl status nginx",
                "command": "systemctl status nginx",
                "why": "Checks active state, uptime, PID, and recent logs of system service."
              },
              {
                "id": "linux-sys-2",
                "label": "systemctl restart nginx",
                "command": "systemctl restart nginx",
                "why": "Restarts daemon after configuration changes."
              },
              {
                "id": "linux-sys-3",
                "label": "systemctl enable --now nginx",
                "command": "systemctl enable --now nginx",
                "why": "Enables service to start on boot and immediately starts execution."
              },
              {
                "id": "linux-sys-4",
                "label": "journalctl -u nginx -f",
                "command": "journalctl -u nginx -f",
                "why": "Follows systemd journal logs specifically for NGINX unit."
              }
            ]
          }
        ]
      },
      {
        "id": "net-storage",
        "title": "Networking & storage",
        "commands": [
          {
            "title": "Network Connectivity",
            "items": [
              {
                "id": "linux-net-1",
                "label": "netstat -tulpn / ss -tulpn",
                "command": "ss -tulpn",
                "why": "Displays open listening TCP/UDP ports and associated process names."
              },
              {
                "id": "linux-net-2",
                "label": "curl -I https://api.example.com/health",
                "command": "curl -I https://api.example.com/health",
                "why": "Fetches HTTP headers only to verify server status, SSL, and response codes."
              },
              {
                "id": "linux-net-3",
                "label": "nc -zv 10.0.0.5 5432",
                "command": "nc -zv 10.0.0.5 5432",
                "why": "Tests TCP connectivity and firewall port reachability to database host."
              },
              {
                "id": "linux-net-4",
                "label": "dig +short example.com",
                "command": "dig +short example.com",
                "why": "Queries DNS A records for domain resolution."
              }
            ]
          },
          {
            "title": "Storage & Disk",
            "items": [
              {
                "id": "linux-disk-1",
                "label": "df -h",
                "command": "df -h",
                "why": "Shows mounted filesystem space usage and available capacity."
              },
              {
                "id": "linux-disk-2",
                "label": "du -sh /var/log/*",
                "command": "du -sh /var/log/*",
                "why": "Summarizes disk space consumption per folder in /var/log."
              },
              {
                "id": "linux-disk-3",
                "label": "lsblk",
                "command": "lsblk",
                "why": "Lists block storage devices, partitions, and mount points."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "shell",
    "title": "Shell scripting",
    "subtitle": "Make repeatable work automatic.",
    "sections": [
      {
        "id": "shell-essentials",
        "title": "Script essentials",
        "commands": [
          {
            "title": "Header & Strict Mode",
            "items": [
              {
                "id": "shell-1",
                "label": "#!/bin/bash",
                "command": "#!/bin/bash",
                "why": "Shebang header specifying bash interpreter execution path."
              },
              {
                "id": "shell-2",
                "label": "set -euo pipefail",
                "command": "set -euo pipefail",
                "why": "Strict script mode: exits on error (-e), unset variables (-u), and pipe failures (-o pipefail)."
              },
              {
                "id": "shell-3",
                "label": "chmod +x deploy.sh",
                "command": "chmod +x deploy.sh",
                "why": "Makes script file directly executable via `./deploy.sh`."
              }
            ]
          },
          {
            "title": "Variables & Output",
            "items": [
              {
                "id": "shell-var-1",
                "label": "NAME=\"production\"",
                "command": "NAME=\"production\"",
                "why": "Assigns string without spaces around equals sign."
              },
              {
                "id": "shell-var-2",
                "label": "echo \"Environment: ${NAME}\"",
                "command": "echo \"Environment: ${NAME}\"",
                "why": "Prints string with variable expansion."
              },
              {
                "id": "shell-var-3",
                "label": "NOW=$(date +%Y%m%d_%H%M%S)",
                "command": "NOW=$(date +%Y%m%d_%H%M%S)",
                "why": "Executes command inside subshell and stores output string."
              }
            ]
          }
        ]
      },
      {
        "id": "shell-control",
        "title": "Control flow & functions",
        "commands": [
          {
            "title": "Conditionals & Loops",
            "items": [
              {
                "id": "shell-if-1",
                "label": "if [ -f \"$FILE\" ]; then ... fi",
                "command": "if [ -f \"$FILE\" ]; then\n  echo \"File exists\"\nfi",
                "why": "Checks if file exists and is a regular file."
              },
              {
                "id": "shell-for-1",
                "label": "for srv in web db api; do ... done",
                "command": "for srv in web db api; do\n  ping -c 1 \"$srv\"\ndone",
                "why": "Iterates over a list of items executing commands."
              }
            ]
          },
          {
            "title": "Functions & Error Handling",
            "items": [
              {
                "id": "shell-fn-1",
                "label": "log_info() { echo \"[INFO] $1\"; }",
                "command": "log_info() { echo \"[INFO] $1\"; }",
                "why": "Defines reusable function accepting positional arguments ($1)."
              },
              {
                "id": "shell-fn-2",
                "label": "trap 'cleanup' EXIT",
                "command": "trap 'cleanup' EXIT",
                "why": "Registers function hook executed on script termination or interrupt."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "terraform",
    "title": "Terraform",
    "subtitle": "Define and manage infrastructure as code.",
    "sections": [
      {
        "id": "tf-cli",
        "title": "CLI workflow",
        "commands": [
          {
            "title": "Lifecycle Commands",
            "items": [
              {
                "id": "tf-1",
                "label": "terraform init",
                "command": "terraform init",
                "why": "Initializes directory, downloads provider plugins (AWS, Azure, GCP), and configures backend."
              },
              {
                "id": "tf-2",
                "label": "terraform plan -out=tfplan",
                "command": "terraform plan -out=tfplan",
                "why": "Generates execution plan showing resources to create (+), modify (~), or destroy (-)."
              },
              {
                "id": "tf-3",
                "label": "terraform apply tfplan",
                "command": "terraform apply tfplan",
                "why": "Executes pre-approved plan file deterministically."
              },
              {
                "id": "tf-4",
                "label": "terraform fmt -recursive",
                "command": "terraform fmt -recursive",
                "why": "Formats HCL code across all subdirectories to standard style."
              }
            ]
          },
          {
            "title": "State Management",
            "items": [
              {
                "id": "tf-st-1",
                "label": "terraform state list",
                "command": "terraform state list",
                "why": "Lists all resources tracked in tfstate file."
              },
              {
                "id": "tf-st-2",
                "label": "terraform import aws_s3_bucket.bucket my-bucket-name",
                "command": "terraform import aws_s3_bucket.bucket my-bucket-name",
                "why": "Brings existing cloud infrastructure under Terraform state control."
              }
            ]
          }
        ]
      }
    ]
  }
];
