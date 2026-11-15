# Reconcile docs: Kubernetes and Argo CD, explained with a café

These pages explain how Reconcile runs in Kubernetes and on AWS, for someone
who has used Docker but finds Kubernetes, Argo CD and cloud networking
confusing. No prior knowledge needed.

Each chapter uses the **same story**: Reconcile is a café, and Kubernetes is
the way the café is staffed and run. Every idea starts with the story, then
shows what it is called in Kubernetes and where it is in this project.

## Reading order

| # | Page | You'll understand |
|---|------|-------------------|
| 1 | [The big picture](01-the-big-picture.md) | What happens when someone opens the site, and when you push code |
| 2 | [Kubernetes](02-kubernetes.md) | Cluster, node, pod, deployment, service, probes, secrets, PDB |
| 3 | [Helm](03-helm.md) | Why the chart has templates and a `values.yaml` |
| 4 | [Argo CD](04-argocd.md) | GitOps, sync, self-heal, and what deleting things does |
| 5 | [The pipeline](05-the-pipeline.md) | Push → tests → images → bot commit → deploy |
| 6 | [Troubleshooting](06-troubleshooting.md) | Real problems we hit, and a command cheat sheet |
| 7 | [AWS](07-aws.md) | The café in a real city: VPC, public/private/database subnets, EKS, DocumentDB, Terraform |

## The cast

Keep this table nearby. Every page uses these characters.

| In the café story | In Kubernetes | In this project |
|---|---|---|
| A sealed **meal kit** with the recipe inside, identical everywhere | **Image** | `ghcr.io/thetangentline/reconcile/backend:<commit>` |
| A kit being cooked and served right now | **Container** | One running copy of the backend |
| A **kitchen** | **Node** (a machine) | `minikube`, `minikube-m02`, `minikube-m03` |
| The whole café building with all its kitchens | **Cluster** | Your minikube cluster |
| The **manager's office** and its whiteboard of "how things should be" | **Control plane** | Runs inside the `minikube` node |
| A **cook** at a station | **Pod** | `reconcile-backend-65cfd6fb95-4pkvs` |
| A **staffing rule**: "always keep 5 backend cooks on shift" | **Deployment** | `reconcile-backend` |
| The **order window** with a fixed name; hands each order to a free cook | **Service** | `reconcile-backend`, `reconcile-frontend` |
| A **floor** of the building, kept separate from others | **Namespace** | `reconcile`, `argocd` |
| The **pantry keeper** with a personal locker that stays when they change | **StatefulSet** + **volume** | `reconcile-mongodb-0` and its data |
| The **safe** holding the pantry combination | **Secret** | `reconcile-mongodb-auth` |
| "Only one cook may leave at a time during renovations" | **PodDisruptionBudget** | One per Deployment |
| The franchise **binder of blank forms** plus **one order sheet** | **Helm chart** + **values.yaml** | `charts/reconcile/` |
| The **HQ inspector** who compares the café to the official blueprint and fixes differences | **Argo CD** | The `reconcile` Application |
| The **central bakery** that tests recipes and seals new kits | **CI** (GitHub Actions) | `.github/workflows/ci.yml` |
| The **warehouse** of sealed kits | **Container registry** | GHCR (GitHub Container Registry) |

On AWS ([chapter 7](07-aws.md)) a few more characters join:

| In the café story | In AWS | In this project |
|---|---|---|
| The **walled compound** on a plot in the city | **VPC** in a **region** | `infra/network.tf` |
| The **lobby** facing the street | **public subnets** | load balancer + NAT gateway |
| The **kitchens** with no street door | **private subnets** | EKS worker nodes |
| The **vault** in the basement | **database subnets** | Amazon DocumentDB |
| The **host** at the front door | **Application Load Balancer** | created from the Ingress |
| The **staff exit** (out only) | **NAT gateway** | |
| **Guards** with a guest list | **security groups** | |
| The **management company** running the manager's office | **Amazon EKS** | `infra/eks.tf` |
| The **architect's plans** and **ledger** | **Terraform** and its **state** | `infra/` |

## One word to remember: *reconcile*

The project's name happens to be the most important idea in Kubernetes.

> [!IMPORTANT]
> You never tell Kubernetes *"start a pod"*. You write down **how things
> should be** ("5 backend pods running version X"), and Kubernetes keeps
> comparing that with **how things are**, fixing any difference. That endless
> compare-and-fix loop is called **reconciliation**.

Argo CD does the same thing one level up: it compares **Git** with the
**cluster**. Once this idea clicks, the rest of these pages are details.

## Viewing the diagrams

Diagrams are written in [Mermaid](https://mermaid.js.org/). GitHub draws them
automatically. In VS Code, install the *Markdown Preview Mermaid Support*
extension and open the preview (`Ctrl+Shift+V`).
