import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { statisticsService, DashboardStatistics } from '../services/statistics.service';

const DashboardPage = () => {
    const { user, token } = useAuth();
    const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            if (!token) return;

            try {
                setLoading(true);
                const data = await statisticsService.getDashboardStatistics(token);
                setStatistics(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching statistics:', err);
                setError('Failed to load statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [token]);

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

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-black"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Statistics Grid */}
                {!loading && !error && statistics && (
                    <>
                        {/* Overview Stats */}
                        <div className="mb-8">
                            <h2 className="mb-4 text-2xl font-bold text-black">Overview</h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {/* Total Users */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.overview.totalUsers.toLocaleString()}</p>
                                    <p className="mt-1 text-sm text-green-600">+{statistics.overview.newUsersLast30Days} last 30 days</p>

                                    {/* Platform Breakdown */}
                                    <div className="mt-4 flex items-center gap-2">
                                        {statistics.overview.platformDistribution.android > 0 && (
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                🤖 {statistics.overview.platformDistribution.android}
                                            </span>
                                        )}
                                        {statistics.overview.platformDistribution.ios > 0 && (
                                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                🍎 {statistics.overview.platformDistribution.ios}
                                            </span>
                                        )}
                                        {statistics.overview.platformDistribution.web > 0 && (
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                🌐 {statistics.overview.platformDistribution.web}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Active Subscriptions */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Active Subscribers</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.overview.activeSubscriptions.toLocaleString()}</p>
                                    <p className="mt-1 text-sm text-purple-600">{statistics.overview.conversionRate}% conversion</p>
                                </div>

                                {/* Daily Logs */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Total Logs</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.overview.totalDailyLogs.toLocaleString()}</p>
                                    <p className="mt-1 text-sm text-green-600">{statistics.overview.avgLogsPerUser.toFixed(1)} avg/user</p>
                                </div>

                                {/* Users with Plans */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Users with Plans</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.overview.usersWithPlans.toLocaleString()}</p>
                                    <p className="mt-1 text-sm text-orange-600">{((statistics.overview.usersWithPlans / statistics.overview.totalUsers) * 100).toFixed(1)}% of users</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Analysis Stats */}
                        <div className="mb-8">
                            <h2 className="mb-4 text-2xl font-bold text-black">AI Analysis</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Image Analyses */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-indigo-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Image Analyses</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.overview.totalImageAnalyses.toLocaleString()}</p>
                                    <p className="mt-1 text-sm text-indigo-600">Food photos analyzed</p>
                                </div>

                                {/* Text Analyses */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-teal-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Text Analyses</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.overview.totalTextAnalyses.toLocaleString()}</p>
                                    <p className="mt-1 text-sm text-teal-600">Manual entries analyzed</p>
                                </div>

                                {/* Training Sessions */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Training Sessions</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.overview.totalTrainingSessions.toLocaleString()}</p>
                                    <p className="mt-1 text-sm text-red-600">Exercise logs recorded</p>
                                </div>
                            </div>
                        </div>

                        {/* Subscription Breakdown */}
                        <div className="mb-8">
                            <h2 className="mb-4 text-2xl font-bold text-black">Subscription Plans</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Monthly Subscriptions */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-medium text-gray-600">Monthly Plans</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.subscriptions.monthly}</p>
                                </div>

                                {/* Yearly Subscriptions */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-medium text-gray-600">Yearly Plans</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.subscriptions.yearly}</p>
                                </div>

                                {/* Total Active */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-medium text-gray-600">Total Active</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">{statistics.subscriptions.total}</p>
                                </div>
                            </div>
                        </div>

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
                    </>
                )}
            </div>
        </Layout>
    );
};

export default DashboardPage;

