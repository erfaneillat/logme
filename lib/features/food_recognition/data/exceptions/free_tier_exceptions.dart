/// Exception thrown when a free tier user exceeds their daily image analysis limit
class FreeTierLimitExceededException implements Exception {
  /// The error message from the server
  final String message;

  /// The date when the limit will reset (YYYY-MM-DD format)
  final String nextResetDate;

  /// Whether the user should be prompted to subscribe
  final bool needsSubscription;

  FreeTierLimitExceededException({
    required this.message,
    required this.nextResetDate,
    this.needsSubscription = true,
  });

  @override
  String toString() =>
      'FreeTierLimitExceededException: $message (Resets: $nextResetDate)';
}
