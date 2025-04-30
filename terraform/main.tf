terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"

  backend "s3" {
    bucket = "your-terraform-state-bucket-name"
    key    = "terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"
}

# --- Variables ---

variable "application_name" {
  type    = string
  default = "react-app"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"] # Assuming 2 AZs for HA
}

variable "private_subnet_cidr" {
  type    = list(string)
  default = ["10.0.3.0/24", "10.0.4.0/24"] # Assuming 2 AZs for HA
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "db_username" {
  type = string
  default = "admin"
  sensitive = true # Important: Securely manage secrets
}

variable "db_password" {
  type = string
  sensitive = true # Important: Securely manage secrets
}

variable "db_instance_class" {
  type = string
  default = "db.t3.medium"
}

# --- Data ---
data "aws_availability_zones" "available" {
  state = "available"
  region = "us-east-1"
}

# --- Resources ---

# VPC
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = {
    Name = "${var.application_name}-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public_subnet" {
  count      = length(var.public_subnet_cidr)
  vpc_id     = aws_vpc.main.id
  cidr_block = var.public_subnet_cidr[count.index]
  availability_zone = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.application_name}-public-subnet-${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "private_subnet" {
  count      = length(var.private_subnet_cidr)
  vpc_id     = aws_vpc.main.id
  cidr_block = var.private_subnet_cidr[count.index]
  availability_zone = var.availability_zones[count.index]
  tags = {
    Name = "${var.application_name}-private-subnet-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.application_name}-igw"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "${var.application_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_subnet_assoc" {
  count          = length(var.public_subnet_cidr)
  subnet_id      = aws_subnet.public_subnet[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# --- S3 Bucket for Static Assets ---

resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.application_name}-static-assets"
  acl    = "private" # Block public access by default

  versioning {
    enabled = true
  }

  tags = {
    Name = "${var.application_name}-static-assets-bucket"
  }
}

resource "aws_s3_bucket_public_access_block" "public_access_block" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "static_assets_policy" {
  bucket = aws_s3_bucket.static_assets.id
  policy = data.aws_iam_policy_document.static_assets_policy.json
}

# IAM Policy for CloudFront to Access S3
data "aws_iam_policy_document" "static_assets_policy" {
  statement {
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.origin_access_identity.iam_arn]
    }
    resources = [
      aws_s3_bucket.static_assets.arn,
      "${aws_s3_bucket.static_assets.arn}/*"
    ]
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "origin_access_identity" {
  comment = "OAI for ${var.application_name}-static-assets"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_assets.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.bucket}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  aliases = [] # add your domain here
}

# --- Database ---
resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.application_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet[0].id, aws_subnet.private_subnet[1].id]
  tags = {
    Name = "${var.application_name}-db-subnet-group"
  }
}

resource "aws_security_group" "rds_sg" {
  name = "${var.application_name}-rds-sg"
  description = "Allow traffic to RDS instance"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 5432  # Change port to your database type
    to_port     = 5432  # Change port to your database type
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.application_name}-rds-sg"
  }
}

resource "aws_db_instance" "db_instance" {
  allocated_storage    = 20
  db_subnet_group_name = aws_db_subnet_group.db_subnet_group.name
  engine               = "postgres" # Change engine type here
  engine_version       = "15.4" # Change engine version if desired
  instance_class       = var.db_instance_class
  name                 = var.application_name
  username             = var.db_username
  password             = var.db_password
  multi_az             = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot  = true

  tags = {
    Name = "${var.application_name}-db-instance"
  }
}

# --- API Gateway and Lambda (Example) ---
# More code would be required for the Lambda function deployment, IAM roles for Lambda execution,
# API Gateway setup and integration with Lambda functions
# This is just a placeholder.

# Output DNS address
output "cloudfront_domain" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

# Output RDS endpoint
output "rds_endpoint" {
  value = aws_db_instance.db_instance.endpoint
}