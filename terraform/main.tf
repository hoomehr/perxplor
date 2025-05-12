terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"
}

# Configure the main AWS provider
provider "aws" {
  region = var.aws_region
}

# Configure the AWS provider for us-east-1 (required for CloudFront ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# --- Variables ---

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2" # Choose your desired region
}

variable "project_name" {
  description = "A unique name for the project used for naming resources"
  type        = string
  default     = "react-app"
}

variable "domain_name" {
  description = "The custom domain name for the application (e.g., app.yourdomain.com)"
  type        = string
  # Example: default = "app.example.com" # Replace with your actual domain
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ReactApp"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# --- DNS ---

data "aws_route53_zone" "primary" {
  name         = trimsuffix(var.domain_name, ".") # Extracts the zone name like yourdomain.com from app.yourdomain.com
  private_zone = false
}

# --- ACM Certificate (Requires DNS Validation - ensure Route 53 is managed by AWS) ---
# Note: This resource must be created in us-east-1 for CloudFront

resource "aws_acm_certificate" "cert" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = merge(var.tags, { Name = "${var.project_name}-certificate" })

  lifecycle {
    create_before_destroy = true
  }
}

# Create DNS validation records in Route 53
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.primary.zone_id
}

# Wait for the certificate to be validated
resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}


# --- S3 Buckets ---

# Bucket for storing the static website content (React build artifacts)
resource "aws_s3_bucket" "app_bucket" {
  bucket = "${var.project_name}-assets-${var.domain_name}" # Needs globally unique name
  tags   = merge(var.tags, { Name = "${var.project_name}-assets-bucket" })
}

resource "aws_s3_bucket_versioning" "app_bucket_versioning" {
  bucket = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "app_bucket_access_block" {
  bucket                  = aws_s3_bucket.app_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket for storing CloudFront and potentially S3 access logs
resource "aws_s3_bucket" "log_bucket" {
  bucket = "${var.project_name}-logs-${var.domain_name}" # Needs globally unique name
  tags   = merge(var.tags, { Name = "${var.project_name}-logs-bucket" })
}

resource "aws_s3_bucket_versioning" "log_bucket_versioning" {
  bucket = aws_s3_bucket.log_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "log_bucket_access_block" {
  bucket                  = aws_s3_bucket.log_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "log_bucket_lifecycle" {
  bucket = aws_s3_bucket.log_bucket.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = 90 # Configure log retention period (e.g., 90 days)
    }

    # Optional: Transition non-current versions to Glacier/Deep Archive after some time
    # noncurrent_version_transition {
    #   days          = 30
    #   storage_class = "GLACIER"
    # }
    # noncurrent_version_expiration {
    #   days = 60
    # }
  }
}

# --- CloudFront ---

# Origin Access Control (OAC) - Recommended over OAI
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project_name}-s3-oac"
  description                       = "OAC for ${var.project_name} S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy allowing CloudFront access via OAC
data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.app_bucket.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.s3_distribution.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "app_bucket_policy" {
  bucket = aws_s3_bucket.app_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name              = aws_s3_bucket.app_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
    origin_id                = "S3-${aws_s3_bucket.app_bucket.id}"
    # If using OAI instead of OAC:
    # s3_origin_config {
    #   origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    # }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.project_name}"
  default_root_object = "index.html"

  aliases = [var.domain_name]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.app_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600 # Cache static assets for 1 hour
    max_ttl                = 86400 # Cache static assets for 1 day

    # Use a managed cache policy for optimized caching
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    # Optional: Use a managed origin request policy if CORS headers needed from S3
    # origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin
  }

  # Handle Single Page App (SPA) routing - return index.html for 403/404 errors
  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }
  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  price_class = "PriceClass_100" # Or PriceClass_200 / PriceClass_All

  restrictions {
    geo_restriction {
      restriction_type = "none" # Or whitelist/blacklist specific countries
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cert.certificate_arn # Use validated cert
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.log_bucket.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  # Attach WAF WebACL
  web_acl_id = aws_wafv2_web_acl.waf_acl.arn

  tags = merge(var.tags, { Name = "${var.project_name}-cloudfront" })

  # Wait for the S3 policy to allow CloudFront ARN before creating distribution
  depends_on = [aws_s3_bucket_policy.app_bucket_policy]
}

# --- Route 53 Alias Record ---

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Optional: Create IPv6 Record (AAAA)
resource "aws_route53_record" "www_ipv6" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}


# --- WAF ---

resource "aws_wafv2_web_acl" "waf_acl" {
  name  = "${var.project_name}-web-acl"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Example: Use AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
        # excluded_rule { # Optional: exclude specific rules if they cause issues
        #   name = "SizeRestrictions_BODY"
        # }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "awsCommonRules"
      sampled_requests_enabled   = true
    }
  }

  # Add more rules as needed (e.g., IP sets, SQLi, XSS, Bot Control)
  # rule {
  #   name     = "AWSManagedRulesAmazonIpReputationList"
  #   priority = 20
  #   ...
  # }
  # rule {
  #   name     = "AWSManagedRulesKnownBadInputsRuleSet"
  #   priority = 30
  #   ...
  # }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-web-acl"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, { Name = "${var.project_name}-web-acl" })
}

# --- Outputs ---

output "s3_bucket_name" {
  value = try(aws_s3_bucket.app_bucket.bucket, "N/A")
  description = "s3_bucket_name"
}

output "cloudfront_distribution_id" {
  value = try(aws_cloudfront_distribution.s3_distribution.id, "N/A")
  description = "cloudfront_distribution_id"
}

output "cloudfront_domain_name" {
  value = try(aws_cloudfront_distribution.s3_distribution.domain_name, "N/A")
  description = "cloudfront_domain_name"
}

output "website_url" {
  description = "URL of the deployed application"
  value       = "https://${var.domain_name}"
}

output "acm_certificate_arn" {
  value = try(aws_acm_certificate_validation.cert.certificate_arn, "N/A")
  description = "acm_certificate_arn"
}