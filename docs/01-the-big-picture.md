# 1. The big picture

Two short stories cover almost everything. The first follows a **visitor**,
the second follows **a code change**.

---

## Story 1: Mai opens the site

Mai wants to learn CFOP. She opens the site and clicks *CFOP*.

**In the café:** Mai walks in through the front door to the **front counter**
(the frontend). For the menu itself (the page, pictures, layout), the counter
staff hand it over directly. When she asks *"what formulas does CFOP have?"*,
the counter passes the question through a hatch to the **kitchen window**
(the backend Service). Whichever **cook** is free takes it, checks the
**pantry** (MongoDB), and sends the answer back.

```mermaid
flowchart LR
    mai([Mai's browser])

    subgraph cluster["Kubernetes cluster (namespace: reconcile)"]
        fesvc{{"Service<br/>reconcile-frontend"}}
        fe1["frontend pod"]
        fe2["frontend pod"]
        fe3["frontend pod"]

        besvc{{"Service<br/>reconcile-backend"}}
        be1["backend pod"]
        be2["backend pod"]
        be3["backend pod ..."]

        db[("reconcile-mongodb-0<br/>+ its data volume")]
    end

    mai -->|"1. GET /method/cfop<br/>4. GET /api/methods/cfop"| fesvc
    fesvc --> fe1 & fe2 & fe3
    fe2 -->|"5. nginx forwards /api"| besvc
    besvc --> be1 & be2 & be3
    be1 -->|"6. read the CFOP document"| db
```

What happened, step by step:

1. Mai's browser asks for `/method/cfop`.
2. The **frontend Service** picks one of the 3 frontend pods.
3. That pod's nginx returns the React app (HTML, JavaScript, CSS).
4. The React app, now running in Mai's browser, asks for `/api/methods/cfop`.
5. The frontend's nginx sees `/api` and forwards it to the **backend Service**,
   which picks one of the backend pods.
6. That backend pod reads the CFOP document from MongoDB and returns JSON.
7. React draws the formulas, and the 3D cube starts turning in Mai's browser.

Things to notice:

- Mai never talks to the backend directly. The frontend's nginx forwards
  `/api` for her, so the whole site lives at one address.
- Mai doesn't know or care **which** pod answered. Any copy can serve any
  request. That is what lets us run several copies and lose one without anyone
  noticing.
- The cube animation runs in Mai's browser, not on the server.

> [!TIP]
> **On your laptop:** the "front door" is the
> `kubectl port-forward svc/reconcile-frontend 8080:80` command. It's like a
> private phone line from your house straight to the front counter. In a real
> deployment an **Ingress** (the street entrance) plays that role.

---

## Story 2: You fix a typo and push

You notice a typo in a formula description, fix it, and run `git push`.
You do nothing else, and about five minutes later the live site has the fix.
Here's who did the work.

**In the café:** you send a corrected recipe to the **central bakery**
(GitHub Actions). The bakery taste-tests it (runs the tests), seals new **meal
kits** stamped with a batch number (images tagged with the commit SHA), and
puts them in the **warehouse** (GHCR). A clerk then updates the café's
**official blueprint** (`values.yaml` in Git) to say "use batch 3696f5d".
The **HQ inspector** (Argo CD) notices the blueprint changed and tells the
café manager (Kubernetes). The manager swaps the cooks one at a time to the
new batch, so the café never closes.

```mermaid
sequenceDiagram
    actor You
    participant GH as GitHub repo
    participant CI as GitHub Actions
    participant REG as GHCR (image warehouse)
    participant Argo as Argo CD
    participant K8s as Kubernetes

    You->>GH: git push (fix typo)
    GH->>CI: start the CI workflow
    CI->>CI: test backend + frontend
    CI->>REG: push backend:SHA and frontend:SHA
    CI->>GH: bot commits "tag: SHA" into values.yaml
    Argo->>GH: checks Git every few minutes
    Argo->>K8s: "make the cluster match the new values.yaml"
    K8s->>REG: pull the new images
    K8s->>K8s: replace pods one at a time
```

The key idea: **you never touch the cluster.** You change Git, and machines
carry the change the rest of the way. That style is called **GitOps**, and
[chapter 4](04-argocd.md) is all about it.

---

## Where each piece lives in the repo

```mermaid
flowchart TB
    subgraph repo["This Git repository"]
        apps["apps/<br/>the code: frontend + backend"]
        wf[".github/workflows/<br/>the bakery's instructions"]
        chart["charts/reconcile/<br/>the blueprint (Helm chart)"]
        argo["argocd/application.yaml<br/>tells the inspector what to watch"]
    end

    apps -->|"CI builds images from"| wf
    wf -->|"bot updates image tags in"| chart
    argo -->|"points Argo CD at"| chart
```

| Folder | Story role | Chapter |
|---|---|---|
| `apps/` | The recipes | Main [README](../README.md) |
| `charts/reconcile/` | The blueprint of the café | [3. Helm](03-helm.md) |
| `argocd/` | The inspector's assignment | [4. Argo CD](04-argocd.md) |
| `.github/workflows/` | The bakery | [5. The pipeline](05-the-pipeline.md) |

Next: [2. Kubernetes →](02-kubernetes.md)
