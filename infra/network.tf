# The VPC: one private network in AWS, split into three kinds of subnet.
#
#   public   (10.0.0.0/24, 10.0.1.0/24, ...)    load balancer + NAT gateway; reachable from the internet
#   private  (10.0.16.0/20, 10.0.32.0/20, ...)  EKS worker nodes and pods; outbound only, via NAT
#   database (10.0.100.0/24, 10.0.101.0/24, ...) DocumentDB; no internet route at all
#
# Private subnets are large (/20 = 4,096 addresses) because on EKS every pod
# gets its own VPC IP address.

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.7"

  name = var.name
  cidr = var.vpc_cidr
  azs  = local.azs

  public_subnets   = [for i, _ in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnets  = [for i, _ in local.azs : cidrsubnet(var.vpc_cidr, 4, i + 1)]
  database_subnets = [for i, _ in local.azs : cidrsubnet(var.vpc_cidr, 8, i + 100)]

  # Outbound internet for the private subnets (pull images, reach AWS APIs).
  enable_nat_gateway     = true
  single_nat_gateway     = var.single_nat_gateway
  one_nat_gateway_per_az = !var.single_nat_gateway

  # Database subnets get their own route table with no route to the internet
  # (neither through the internet gateway nor through NAT).
  create_database_subnet_route_table     = true
  create_database_internet_gateway_route = false
  create_database_nat_gateway_route      = false
  # That module option builds an RDS subnet group; DocumentDB needs its own (database.tf).
  create_database_subnet_group = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tell the AWS Load Balancer Controller where it may place load balancers.
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}
