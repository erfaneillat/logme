import { useState } from 'react';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

type Step = 'phone' | 'code';

const LoginPage = () => {
    const { login } = useAuth();
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.sendVerificationCode(phone);
            if (response.success) {
                setStep('code');
            } else {
                setError(response.message || 'Failed to send verification code');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.verifyAdminPhone(phone, code);
            if (response.success && response.data) {
                login(response.data.token, response.data.user);
            } else {
                setError(response.message || 'Invalid verification code');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep('phone');
        setCode('');
        setError('');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white px-4 py-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/5 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-black/5 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-black shadow-lg">
                        <svg
                            className="h-8 w-8 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-black">
                        Cal AI Admin
                    </h1>
                    <p className="mt-3 text-base text-gray-600">
                        {step === 'phone'
                            ? 'Sign in to access the admin panel'
                            : 'Verify your identity'}
                    </p>
                </div>

                {/* Card */}
                <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
                    {/* Card Accent Border */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-black via-gray-800 to-black opacity-0 transition-opacity duration-300 group-hover:opacity-5"></div>

                    <div className="relative p-8 sm:p-10">
                        {/* Step Indicator */}
                        <div className="mb-8 flex items-center justify-center space-x-2">
                            <div className={`h-2 w-2 rounded-full transition-all duration-300 ${step === 'phone' ? 'bg-black w-8' : 'bg-gray-300'
                                }`}></div>
                            <div className={`h-2 w-2 rounded-full transition-all duration-300 ${step === 'code' ? 'bg-black w-8' : 'bg-gray-300'
                                }`}></div>
                        </div>

                        {step === 'phone' ? (
                            <form onSubmit={handleSendCode} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="mb-3 block text-sm font-semibold text-black"
                                    >
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1234567890"
                                            required
                                            disabled={loading}
                                            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base text-black placeholder-gray-400 transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                            <svg
                                                className="h-5 w-5 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="mt-2.5 text-xs text-gray-500">
                                        Enter your registered admin phone number
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-start space-x-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800">
                                        <svg
                                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !phone}
                                    className="relative w-full overflow-hidden rounded-xl bg-black px-6 py-3.5 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30 focus:outline-none focus:ring-4 focus:ring-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                                >
                                    <span className="relative z-10">
                                        {loading ? (
                                            <span className="flex items-center justify-center space-x-2">
                                                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Sending...</span>
                                            </span>
                                        ) : (
                                            'Send Verification Code'
                                        )}
                                    </span>
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyCode} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="code"
                                        className="mb-3 block text-sm font-semibold text-black"
                                    >
                                        Verification Code
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        required
                                        maxLength={6}
                                        disabled={loading}
                                        autoFocus
                                        className="block w-full rounded-xl border-2 border-gray-200 bg-white px-6 py-4 text-center text-3xl font-mono tracking-[0.5em] text-black placeholder-gray-300 transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
                                    />
                                    <p className="mt-2.5 text-center text-xs text-gray-500">
                                        Enter the 6-digit code sent to <span className="font-medium text-black">{phone}</span>
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-start space-x-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800">
                                        <svg
                                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={loading || code.length !== 6}
                                        className="relative w-full overflow-hidden rounded-xl bg-black px-6 py-3.5 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30 focus:outline-none focus:ring-4 focus:ring-black/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                                    >
                                        <span className="relative z-10">
                                            {loading ? (
                                                <span className="flex items-center justify-center space-x-2">
                                                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Verifying...</span>
                                                </span>
                                            ) : (
                                                'Verify & Sign In'
                                            )}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        disabled={loading}
                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 font-semibold text-black transition-all duration-200 hover:border-black hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-black/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        <svg
                            className="mr-1.5 inline-block h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                        Only authorized admin accounts can access this panel
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

