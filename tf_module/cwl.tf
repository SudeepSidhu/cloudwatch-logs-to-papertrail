resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/lambda/${aws_lambda_function.main.function_name}"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_subscription_filter" "log_subscription" {
  count           = length(var.monitor_log_group_names)
  name            = "${var.monitor_log_group_names[count.index]}-papertrail-subscription"
  destination_arn = aws_lambda_function.main.arn
  log_group_name  = var.monitor_log_group_names[count.index]
  filter_pattern  = var.filter_pattern
  distribution    = "ByLogStream"
}