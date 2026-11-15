# Where Terraform keeps its record of what it built (the "state").
#
# By default it's a local file, terraform.tfstate, in this folder. That's fine
# for trying things out, but the file contains the database password and is
# lost if your laptop is. For anything long-lived, store it in S3: create a
# bucket once, then uncomment this block and run `terraform init -migrate-state`.
#
# terraform {
#   backend "s3" {
#     bucket       = "my-terraform-state-bucket"
#     key          = "reconcile/terraform.tfstate"
#     region       = "us-east-1"
#     encrypt      = true
#     use_lockfile = true # S3-native locking, no DynamoDB table needed
#   }
# }
