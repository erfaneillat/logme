class LoginState {
  final bool isLoading;
  final bool isCodeSent;
  final String? phoneNumber;
  final String? verificationId;
  final String? error;
  final bool isLoggedIn;

  const LoginState({
    this.isLoading = false,
    this.isCodeSent = false,
    this.phoneNumber,
    this.verificationId,
    this.error,
    this.isLoggedIn = false,
  });

  LoginState copyWith({
    bool? isLoading,
    bool? isCodeSent,
    String? phoneNumber,
    String? verificationId,
    String? error,
    bool? isLoggedIn,
  }) {
    return LoginState(
      isLoading: isLoading ?? this.isLoading,
      isCodeSent: isCodeSent ?? this.isCodeSent,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      verificationId: verificationId ?? this.verificationId,
      error: error ?? this.error,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
    );
  }
}
