import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { 
    analyticsService, 
    TimePeriod, 
    UserAnalytics, 
    SubscriptionAnalytics,
    ActivityAnalytics,
    EngagementAnalytics 
} from '../services/analytics.service';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';

const AnalyticsPage = () => {
    const { token } = useAuth();
    const [period, setPeriod] = useState<TimePeriod>('monthly');
    const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
    const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
    const [activityAnalytics, setActivityAnalytics] = useState<ActivityAnalytics | null>(null);
    const [engagementAnalytics, setEngagementAnalytics] = useState<EngagementAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!token) return;
            
            try {
                setLoading(true);
                const [users, subscriptions, activity, engagement] = await Promise.all([
                    analyticsService.getUserAnalytics(token, period),
                    analyticsService.getSubscriptionAnalytics(token, period),
                    analyticsService.getActivityAnalytics(token, period),
                    analyticsService.getEngagementAnalytics(token, period),
                ]);
                
                setUserAnalytics(users);
                setSubscriptionAnalytics(subscriptions);
                setActivityAnalytics(activity);
                setEngagementAnalytics(engagement);
                setError(null);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [token, period]);

    const periodOptions: { value: TimePeriod; label: string }[] = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
    ];

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

    const formatPeriodLabel = (period: string) => {
        if (period.includes('W')) {
            return `Week ${period.split('W')[1]}`;
        }
        return period;
    };

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-black">Analytics</h1>
                                <p className="mt-1 text-base text-gray-600">
                                    Comprehensive data insights and trends
                                </p>
                            </div>
                        </div>

                        {/* Period Selector */}
                        <div className="flex space-x-2 rounded-xl border border-gray-200 bg-white p-1">
                            {periodOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setPeriod(option.value)}
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                        period === option.value
                                            ? 'bg-purple-600 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Analytics Charts */}
                {!loading && !error && userAnalytics && subscriptionAnalytics && activityAnalytics && engagementAnalytics && (
                    <div className="space-y-8">
                        {/* User Analytics Section */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">User Analytics</h2>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* User Registrations Chart */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">User Registrations</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={userAnalytics.registrations}>
                                            <defs>
                                                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="count" 
                                                stroke="#3b82f6" 
                                                strokeWidth={2}
                                                fill="url(#colorRegistrations)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Active vs Verified Users */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Active vs Verified Users</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={(() => {
                                            const merged = new Map();
                                            userAnalytics.activeUsers.forEach(item => {
                                                merged.set(item.period, { period: item.period, activeUsers: item.count });
                                            });
                                            userAnalytics.verifiedUsers.forEach(item => {
                                                const existing = merged.get(item.period) || { period: item.period };
                                                merged.set(item.period, { ...existing, verifiedUsers: item.count });
                                            });
                                            return Array.from(merged.values()).sort((a, b) => a.period.localeCompare(b.period));
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="activeUsers"
                                                stroke="#8b5cf6" 
                                                strokeWidth={2}
                                                name="Active Users"
                                                dot={{ fill: '#8b5cf6' }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="verifiedUsers"
                                                stroke="#10b981" 
                                                strokeWidth={2}
                                                name="Verified Users"
                                                dot={{ fill: '#10b981' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        {/* Subscription Analytics Section */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Subscription Analytics</h2>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Subscription Growth */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Subscription Growth</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={subscriptionAnalytics.newSubscriptions}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Subscription by Type */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Subscription by Type</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={subscriptionAnalytics.subscriptionsByType}
                                                dataKey="count"
                                                nameKey="type"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label
                                            >
                                                {subscriptionAnalytics.subscriptionsByType.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Revenue Chart */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue Over Time</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={subscriptionAnalytics.revenue}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                                formatter={(value: number) => `${value.toLocaleString()} Toman`}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="#10b981" 
                                                strokeWidth={2}
                                                fill="url(#colorRevenue)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        {/* Activity Analytics Section */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Activity Analytics</h2>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Food Logs */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Food Logs</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={activityAnalytics.foodLogs}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Image vs Text Analyses */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Image vs Text Analyses</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={(() => {
                                            const merged = new Map();
                                            activityAnalytics.imageAnalyses.forEach(item => {
                                                merged.set(item.period, { period: item.period, imageAnalyses: item.count });
                                            });
                                            activityAnalytics.textAnalyses.forEach(item => {
                                                const existing = merged.get(item.period) || { period: item.period };
                                                merged.set(item.period, { ...existing, textAnalyses: item.count });
                                            });
                                            return Array.from(merged.values()).sort((a, b) => a.period.localeCompare(b.period));
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="imageAnalyses"
                                                stroke="#06b6d4" 
                                                strokeWidth={2}
                                                name="Image Analyses"
                                                dot={{ fill: '#06b6d4' }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="textAnalyses"
                                                stroke="#ec4899" 
                                                strokeWidth={2}
                                                name="Text Analyses"
                                                dot={{ fill: '#ec4899' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Training Sessions */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Training Sessions</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={activityAnalytics.trainingSessions}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="count" fill="#ef4444" name="Sessions" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        {/* Engagement Analytics Section */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Engagement Analytics</h2>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* User Journey */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">User Journey Progress</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={(() => {
                                            const merged = new Map();
                                            engagementAnalytics.completedInfo.forEach(item => {
                                                merged.set(item.period, { period: item.period, completedInfo: item.count });
                                            });
                                            engagementAnalytics.generatedPlans.forEach(item => {
                                                const existing = merged.get(item.period) || { period: item.period };
                                                merged.set(item.period, { ...existing, generatedPlans: item.count });
                                            });
                                            return Array.from(merged.values()).sort((a, b) => a.period.localeCompare(b.period));
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="completedInfo"
                                                stroke="#3b82f6" 
                                                strokeWidth={2}
                                                name="Completed Info"
                                                dot={{ fill: '#3b82f6' }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="generatedPlans"
                                                stroke="#f59e0b" 
                                                strokeWidth={2}
                                                name="Generated Plans"
                                                dot={{ fill: '#f59e0b' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Average Logs Per User */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Avg Logs Per Active User</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={engagementAnalytics.avgLogs}>
                                            <defs>
                                                <linearGradient id="colorAvgLogs" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="period" 
                                                stroke="#6b7280" 
                                                fontSize={12}
                                                tickFormatter={formatPeriodLabel}
                                            />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="average" 
                                                stroke="#8b5cf6" 
                                                strokeWidth={2}
                                                fill="url(#colorAvgLogs)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AnalyticsPage;
