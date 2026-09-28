export interface EvidenceItem {
  label: string;
  code: string;
  language?: string;
}

export interface ChoiceItem {
  id: string;
  text: string;
}

export interface Challenge {
  id: string;
  title: string;
  topic: string; // 'docker' | 'linux' | 'git' | 'kubernetes' | 'github-actions'
  difficulty: "Foundations" | "Intermediate" | "Advanced";
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  scenario: string;
  evidence: EvidenceItem[];
  choices: ChoiceItem[];
  correctChoiceId: string;
  explanation: string;
  disabled?: boolean;
}

export function getChallengeExperienceLevel(c: Challenge): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (c.experienceLevel) return c.experienceLevel;
  if (c.difficulty === 'Foundations') return 'Beginner';
  if (c.difficulty === 'Advanced') return 'Advanced';
  return 'Intermediate';
}

export const CHALLENGES: Challenge[] = [
  {
    id: "docker-upstream-port",
    title: "The deployment that returns 502 Bad Gateway",
    topic: "docker",
    difficulty: "Foundations",
    scenario: "After deploying a new API service version behind NGINX reverse proxy with Docker Compose, all incoming requests return '502 Bad Gateway'. NGINX container is running, but proxying fails.",
    evidence: [
      {
        label: "compose.yaml · relevant services",
        code: `services:
  api:
    image: example-api:1.4
    ports:
      - "9000:8000"
  proxy:
    image: nginx:alpine
    ports:
      - "8080:80"`,
        language: "yaml"
      },
      {
        label: "nginx.conf · mounted proxy configuration",
        code: `server {
    listen 80;
    location / {
        proxy_pass http://api:9000;
        proxy_set_header Host $host;
    }
}`,
        language: "nginx"
      },
      {
        label: "Terminal Logs & Connectivity Checks",
        code: `api_1   | 2026/09/27 11:00:00 Listening on 0.0.0.0:8000
proxy_1 | 2026/09/27 11:00:05 [error] connect() failed (111: Connection refused) while connecting to upstream
From proxy container shell:
$ curl http://api:8000/health -> 200 OK
$ curl http://api:9000/health -> Connection refused`,
        language: "bash"
      }
    ],
    choices: [
      {
        id: "choice-a",
        text: "The NGINX proxy container lacks permissions to bind to host port 8080."
      },
      {
        id: "choice-b",
        text: "proxy_pass targets host port 9000 instead of internal container port 8000."
      },
      {
        id: "choice-c",
        text: "The API container requires host network mode to expose port 8000."
      },
      {
        id: "choice-d",
        text: "The NGINX image requires custom SELinux volume flags."
      }
    ],
    correctChoiceId: "choice-b",
    explanation: "Inside a Docker network, containers communicate directly using container service names and internal container target ports (8000). The host port mapping (`9000:8000`) only exposes port 9000 to the host machine interface, not inside the internal Docker bridge network. NGINX should target `http://api:8000`."
  },
  {
    id: "linux-script-permission",
    title: "The backup script will not start",
    topic: "linux",
    difficulty: "Foundations",
    scenario: "A cron job deployment fails because the automated `backup.sh` maintenance script cannot be executed directly by the deploy user.",
    evidence: [
      {
        label: "Terminal · deploy account inspection",
        code: `$ ls -l backup.sh
-rw-r----- 1 deploy ops 284 Sep 27 09:00 backup.sh

$ head -n 1 backup.sh
#!/bin/bash

$ ./backup.sh
bash: ./backup.sh: Permission denied

$ bash backup.sh
[SUCCESS] Backup complete: /var/backups/db_2026.tar.gz created`,
        language: "bash"
      }
    ],
    choices: [
      {
        id: "choice-a",
        text: "The shebang interpreter path `#!/bin/bash` is invalid."
      },
      {
        id: "choice-b",
        text: "The file is missing executable permissions (`chmod +x backup.sh`)."
      },
      {
        id: "choice-c",
        text: "The user `deploy` does not belong to the `root` group."
      },
      {
        id: "choice-d",
        text: "The script must be converted to binary format using gcc."
      }
    ],
    correctChoiceId: "choice-b",
    explanation: "The file permission string `-rw-r-----` indicates read (r) and write (w) permissions for owner `deploy`, but lacks the execute bit (`x`). When executing `./backup.sh` directly, the OS kernel checks for the execute bit. Running `chmod +x backup.sh` sets `-rwxr-x---` allowing execution."
  },
  {
    id: "git-recover-commit",
    title: "A local commit disappeared after git reset",
    topic: "git",
    difficulty: "Foundations",
    scenario: "A developer accidentally ran `git reset --hard HEAD~1` thinking it was a soft reset. The feature commit containing 2 hours of code disappeared from `git log` and `git status`.",
    evidence: [
      {
        label: "git reflog · local HEAD history",
        code: `8d21abc (HEAD -> feature/health) HEAD@{0}: reset: moving to HEAD~1
4f31bca HEAD@{1}: commit: Add health endpoint and status check
8d21abc HEAD@{2}: commit: Configure application settings`,
        language: "git"
      },
      {
        label: "git status",
        code: `On branch feature/health
nothing to commit, working tree clean`,
        language: "bash"
      }
    ],
    choices: [
      {
        id: "choice-a",
        text: "Re-checkout the commit using `git checkout 4f31bca` or `git cherry-pick 4f31bca`."
      },
      {
        id: "choice-b",
        text: "Run `git push --force` to restore remote object store."
      },
      {
        id: "choice-c",
        text: "Run `git stash pop` to recover working tree changes."
      },
      {
        id: "choice-d",
        text: "Re-clone repository from origin to recover local commits."
      }
    ],
    correctChoiceId: "choice-a",
    explanation: "Git commits are never immediately deleted when reset; they remain in Git's object database. `git reflog` tracks every HEAD movement. The lost commit is SHA `4f31bca`. It can be recovered by running `git checkout 4f31bca` or `git reset --hard 4f31bca`."
  },
  {
    id: "kubernetes-readiness-path",
    title: "Running, but not ready",
    topic: "kubernetes",
    difficulty: "Foundations",
    scenario: "A newly deployed API pod enters state `Running (0/1 Ready)` and does not receive traffic from the Kubernetes Service.",
    evidence: [
      {
        label: "Deployment · readiness probe specification",
        code: "spec:\n  containers:\n  - name: api\n    image: api-service:v2\n    readinessProbe:\n      httpGet:\n        path: /ready\n        port: 8080\n      periodSeconds: 5",
        language: "yaml"
      },
      {
        label: "Pod events & direct curl test",
        code: `$ kubectl get pod api-789bf-x29
NAME            READY   STATUS    RESTARTS   AGE
api-789bf-x29   0/1     Running   0          3m

$ kubectl describe pod api-789bf-x29
Warning  Unhealthy  Readiness probe failed: HTTP probe failed with statuscode: 404

$ kubectl exec api-789bf-x29 -- curl http://localhost:8080/healthz
HTTP/1.1 200 OK
{"status":"healthy"}

$ kubectl exec api-789bf-x29 -- curl http://localhost:8080/ready
HTTP/1.1 404 Not Found`,
        language: "bash"
      }
    ],
    choices: [
      {
        id: "choice-a",
        text: "Container is out of RAM memory and requires OOM kill."
      },
      {
        id: "choice-b",
        text: "Readiness probe path is configured as `/ready` (404), but app endpoint is `/healthz` (200)."
      },
      {
        id: "choice-c",
        text: "Kubernetes CNI plugin failed to assign IP address."
      },
      {
        id: "choice-d",
        text: "Service port 8080 requires TCP socket probe instead of HTTP probe."
      }
    ],
    correctChoiceId: "choice-b",
    explanation: "The readiness probe is querying `GET /ready`, which returns HTTP 404 Not Found from the web server. Direct curl testing confirms the endpoint is located at `/healthz` (HTTP 200 OK). Updating `readinessProbe.httpGet.path` to `/healthz` fixes the probe."
  },
  {
    id: "actions-package-permission",
    title: "The image builds, but will not publish",
    topic: "github-actions",
    difficulty: "Foundations",
    scenario: "A GitHub Actions workflow builds a Docker image successfully, but fails at the `docker push` step targeting GitHub Container Registry (`ghcr.io`).",
    evidence: [
      {
        label: "workflow.yml · job permissions",
        code: `jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read`,
        language: "yaml"
      },
      {
        label: "Workflow Run Log · docker push step",
        code: `Run docker push ghcr.io/my-org/backend-api:latest
The push refers to repository [ghcr.io/my-org/backend-api]
8f8444e0e6c9: Preparing
denied: permission_denied: write_package
Error: Process completed with exit code 1.`,
        language: "bash"
      }
    ],
    choices: [
      {
        id: "choice-a",
        text: "The GITHUB_TOKEN requires `permissions: packages: write`."
      },
      {
        id: "choice-b",
        text: "GitHub Container Registry requires paid Enterprise license."
      },
      {
        id: "choice-c",
        text: "The Docker image tag format must start with `docker.io`."
      },
      {
        id: "choice-d",
        text: "Ubuntu runner requires sudo privileges to invoke `docker push`."
      }
    ],
    correctChoiceId: "choice-a",
    explanation: "By default, GitHub Actions automatic `GITHUB_TOKEN` uses restricted read-only permissions. Pushing images to `ghcr.io` requires write access to packages. Explicitly setting `permissions: packages: write` in the workflow job solves the permission denied error."
  }
];
