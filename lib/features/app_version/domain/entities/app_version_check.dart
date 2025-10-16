class AppVersionCheck {
  final bool isForceUpdate;
  final bool isOptionalUpdate;
  final String? updateTitle;
  final String? updateMessage;
  final String? storeUrl;
  final String? latestVersion;
  final int? latestBuildNumber;

  AppVersionCheck({
    required this.isForceUpdate,
    required this.isOptionalUpdate,
    this.updateTitle,
    this.updateMessage,
    this.storeUrl,
    this.latestVersion,
    this.latestBuildNumber,
  });

  bool get shouldShowUpdate => isForceUpdate || isOptionalUpdate;
}
