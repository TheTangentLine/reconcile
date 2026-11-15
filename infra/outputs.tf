output "region" {
  value = var.region
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "configure_kubectl" {
  description = "Run this to point kubectl at the new cluster."
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "subnets" {
  description = "Subnet IDs by tier."
  value = {
    public   = module.vpc.public_subnets
    private  = module.vpc.private_subnets
    database = module.vpc.database_subnets
  }
}

output "docdb_endpoint" {
  description = "DocumentDB cluster endpoint (reachable only from inside the VPC)."
  value       = aws_docdb_cluster.this.endpoint
}

output "argocd_admin_password_command" {
  value = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d; echo"
}

output "app_url_command" {
  description = "Prints the public load balancer address once Argo CD has deployed the app."
  value       = "kubectl -n reconcile get ingress reconcile -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'; echo"
}
