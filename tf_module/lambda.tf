locals {
  lambda_zip_file = "${path.module}/cloudwatch-papertrail-lambda.zip"
}

resource "aws_lambda_permission" "invoke_from_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "logs.amazonaws.com"
}

resource "aws_lambda_function" "main" {
  filename      = local.lambda_zip_file
  function_name = "${var.lambda_name_prefix}-papertrail-lambda"
  handler       = "cloudwatch-papertrail.handler"
  role          = var.lambda_log_role_arn
  description   = "Receives events from CloudWatch log groups and sends them to Papertrail"
  runtime       = "nodejs8.10"
  timeout       = var.timeout

  environment {
    variables = {
      PAPERTRAIL_HOST  = var.papertrail_host
      PAPERTRAIL_PORT  = var.papertrail_port
      PARSE_LOG_LEVELS = var.parse_log_levels
      LOG_LEVEL_REGEX  = var.log_levels_regex
    }
  }

  source_code_hash = filebase64sha256(local.lambda_zip_file)
}
