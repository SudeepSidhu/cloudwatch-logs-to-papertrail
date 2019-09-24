resource "aws_cloudwatch_log_subscription_filter" "all_logs" {
  count           = length(var.monitor_log_group_names)
  name            = "${var.monitor_log_group_names[count.index]}-papertrail-subscription"
  destination_arn = aws_lambda_function.papertrail.arn
  log_group_name  = var.monitor_log_group_names[count.index]
  filter_pattern  = var.filter_pattern
  distribution    = "ByLogStream"
}