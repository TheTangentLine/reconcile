# What gets installed inside the cluster by Terraform. The app itself is not
# here: Argo CD deploys it from Git (argocd/application-aws.yaml).

# Watches Ingress objects and creates Application Load Balancers in the
# public subnets for them.
resource "helm_release" "aws_lb_controller" {
  name       = "aws-load-balancer-controller"
  namespace  = "kube-system"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = var.aws_lb_controller_chart_version

  values = [yamlencode({
    clusterName = module.eks.cluster_name
    region      = var.region
    vpcId       = module.vpc.vpc_id
    serviceAccount = {
      create = true
      name   = "aws-load-balancer-controller"
    }
  })]

  depends_on = [module.aws_lb_controller_pod_identity, module.eks]
}

resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  create_namespace = true
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = var.argocd_chart_version

  values = [yamlencode({
    # No SSO for now; log in as admin.
    dex = { enabled = false }
  })]

  depends_on = [module.eks]
}

resource "kubernetes_namespace_v1" "reconcile" {
  metadata {
    name = "reconcile"
  }

  depends_on = [module.eks]
}

# The backend's database connection string (charts/reconcile/values-aws.yaml
# points backend.externalMongodb.existingSecret here).
resource "kubernetes_secret_v1" "backend_db" {
  metadata {
    name      = "reconcile-backend-db"
    namespace = kubernetes_namespace_v1.reconcile.metadata[0].name
  }

  data = {
    MONGODB_URI = local.mongodb_uri
  }
}
