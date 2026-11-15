variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "name" {
  description = "Name prefix for every resource (VPC, cluster, database...)."
  type        = string
  default     = "reconcile"
}

# ---------- Network ----------

variable "vpc_cidr" {
  description = "Address range of the whole VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "How many availability zones (separate data centers) to spread over."
  type        = number
  default     = 3

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 3
    error_message = "Use 2 or 3 availability zones (EKS and DocumentDB need at least 2)."
  }
}

variable "single_nat_gateway" {
  description = "true: one shared NAT gateway (cheaper). false: one per AZ (survives an AZ outage)."
  type        = bool
  default     = true
}

# ---------- EKS ----------

variable "kubernetes_version" {
  description = "EKS Kubernetes version, e.g. \"1.35\". null = the current EKS default."
  type        = string
  default     = null
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "Who may reach the Kubernetes API (kubectl) from the internet. Set to your own IP, e.g. [\"203.0.113.7/32\"]."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "node_instance_types" {
  description = "EC2 instance types for the worker nodes."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_min_size" {
  description = "Minimum number of worker nodes."
  type        = number
  default     = 3
}

variable "node_desired_size" {
  description = "Number of worker nodes to start with."
  type        = number
  default     = 3
}

variable "node_max_size" {
  description = "Maximum number of worker nodes."
  type        = number
  default     = 4
}

# ---------- DocumentDB ----------

variable "docdb_engine_version" {
  description = "Amazon DocumentDB engine version (MongoDB-compatible API)."
  type        = string
  default     = "5.0.0"
}

variable "docdb_instance_class" {
  description = "DocumentDB instance size."
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "1 = a single instance. 2-3 = a primary plus replicas in other AZs (automatic failover)."
  type        = number
  default     = 1
}

variable "docdb_deletion_protection" {
  description = "Refuse to delete the database until this is set back to false."
  type        = bool
  default     = false
}

variable "docdb_skip_final_snapshot" {
  description = "true: delete the database without taking a last backup (fine while learning)."
  type        = bool
  default     = true
}

# ---------- Cluster add-ons ----------

variable "aws_lb_controller_chart_version" {
  description = "Helm chart version of the AWS Load Balancer Controller."
  type        = string
  default     = "3.6.3"
}

variable "argocd_chart_version" {
  description = "Helm chart version of Argo CD (argo-helm)."
  type        = string
  default     = "10.18.0"
}
