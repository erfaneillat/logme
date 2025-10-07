import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const DashboardPage = () => {
    const { user } = useAuth();

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="mb-6 flex items-center space-x-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-black to-gray-800 shadow-lg">
                            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-black">Dashboard</h1>
                            <p className="mt-1 text-base text-gray-600">
                                Welcome back, <span className="font-semibold text-black">{user?.name || user?.phone}</span>
                            </p>
                        </div>
                    </div>
                </header>

                {/* Cards Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Quick Links */}
                    <Link
                        to="/plans"
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-purple-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                        <div className="relative">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-black">Subscription Plans</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">
                                Manage subscription plans for the mobile app
                            </p>
                            <div className="mt-4 flex items-center text-sm font-semibold text-purple-600 transition-transform duration-200 group-hover:translate-x-1">
                                <span>Manage Plans</span>
                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>

                    {/* User Info Card */}
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-sm">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-black">Your Profile</h3>
                        <dl className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                                <dt className="text-sm font-medium text-gray-600">Phone</dt>
                                <dd className="text-sm font-mono font-semibold text-black">{user?.phone}</dd>
                            </div>
                            {user?.email && (
                                <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                                    <dt className="text-sm font-medium text-gray-600">Email</dt>
                                    <dd className="text-sm font-semibold text-black">{user.email}</dd>
                                </div>
                            )}
                            <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                                <dt className="text-sm font-medium text-gray-600">Status</dt>
                                <dd>
                                    <span className="inline-flex items-center space-x-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                                        <span>Admin</span>
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* System Status */}
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-sm">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-black">System Status</h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2.5">
                                <span className="text-sm font-medium text-gray-700">API Server</span>
                                <span className="flex items-center space-x-2 text-sm font-semibold text-green-600">
                                    <span className="flex h-2 w-2">
                                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                    </span>
                                    <span>Online</span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2.5">
                                <span className="text-sm font-medium text-gray-700">Database</span>
                                <span className="flex items-center space-x-2 text-sm font-semibold text-green-600">
                                    <span className="flex h-2 w-2">
                                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                    </span>
                                    <span>Connected</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;

