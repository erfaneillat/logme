import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import {
    analyticsService,
    TimePeriod,
    UserAnalytics,
    SubscriptionAnalytics,
    ActivityAnalytics,
    EngagementAnalytics,
    CostAnalytics,
    KitchenAnalytics
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
    const [activeTab, setActiveTab] = useState<'general' | 'kitchen'>('general');
    const [period, setPeriod] = useState<TimePeriod>('monthly');
    const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
    const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
    const [activityAnalytics, setActivityAnalytics] = useState<ActivityAnalytics | null>(null);
    const [engagementAnalytics, setEngagementAnalytics] = useState<EngagementAnalytics | null>(null);
    const [costAnalytics, setCostAnalytics] = useState<CostAnalytics | null>(null);
    const [kitchenAnalytics, setKitchenAnalytics] = useState<KitchenAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!token) return;

            try {
                setLoading(true);

                if (activeTab === 'general') {
                    const [users, subscriptions, activity, engagement, costs] = await Promise.all([
                        analyticsService.getUserAnalytics(token, period),
                        analyticsService.getSubscriptionAnalytics(token, period),
                        analyticsService.getActivityAnalytics(token, period),
                        analyticsService.getEngagementAnalytics(token, period),
                        analyticsService.getCostAnalytics(token, period),
                    ]);

                    setUserAnalytics(users);
                    setSubscriptionAnalytics(subscriptions);
                    setActivityAnalytics(activity);
                    setEngagementAnalytics(engagement);
                    setCostAnalytics(costs);
                } else if (activeTab === 'kitchen') {
                    const kitchen = await analyticsService.getKitchenAnalytics(token);
                    setKitchenAnalytics(kitchen);
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [token, period, activeTab]);

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

                        {/* Period Selector - Only show for general tab */}
                        {activeTab === 'general' && (
                            <div className="flex space-x-2 rounded-xl border border-gray-200 bg-white p-1">
                                {periodOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setPeriod(option.value)}
                                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${period === option.value
                                            ? 'bg-purple-600 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex space-x-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${activeTab === 'general'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            General Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('kitchen')}
                            className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${activeTab === 'kitchen'
                                ? 'bg-white text-orange-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
                            </svg>
                            Kitchen Analytics
                        </button>
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

                {/* General Analytics Charts */}
                {!loading && !error && activeTab === 'general' && userAnalytics && subscriptionAnalytics && activityAnalytics && engagementAnalytics && costAnalytics && (
                    <div className="space-y-8">
                        {/* Revenue Overview Section */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Revenue & Costs Overview</h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {/* Total Revenue */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">
                                        {subscriptionAnalytics.revenue.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">Toman</p>
                                </div>

                                {/* Total AI Cost */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Total AI Cost</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">
                                        ${costAnalytics.totalCost.toFixed(4)}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">USD</p>
                                </div>

                                {/* Average Revenue Per Period */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Avg Revenue / Period</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">
                                        {subscriptionAnalytics.revenue.length > 0
                                            ? Math.round(subscriptionAnalytics.revenue.reduce((sum, item) => sum + item.revenue, 0) / subscriptionAnalytics.revenue.length).toLocaleString()
                                            : 0
                                        }
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">Toman</p>
                                </div>

                                {/* Average AI Cost Per User */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Avg Cost / User</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">
                                        ${costAnalytics.avgCost.toFixed(4)}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">{costAnalytics.usersWithCost} users</p>
                                </div>
                            </div>

                            {/* Revenue vs Cost Chart */}
                            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue vs AI Cost Over Time</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={(() => {
                                        const merged = new Map();
                                        subscriptionAnalytics.revenue.forEach(item => {
                                            merged.set(item.period, { period: item.period, revenue: item.revenue });
                                        });
                                        costAnalytics.costOverTime.forEach(item => {
                                            const existing = merged.get(item.period) || { period: item.period, revenue: 0 };
                                            // Convert USD to Toman for comparison (approximate rate: 1 USD = 50,000 Toman)
                                            merged.set(item.period, { ...existing, costToman: item.totalCost * 50000, costUSD: item.totalCost });
                                        });
                                        return Array.from(merged.values()).sort((a, b) => a.period.localeCompare(b.period));
                                    })()}>
                                        <defs>
                                            <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorCost2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="period"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickFormatter={formatPeriodLabel}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.75rem',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value: number, name: string) => {
                                                if (name === 'Revenue') return [`${value.toLocaleString()} Toman`, name];
                                                if (name === 'AI Cost') return [`${value.toLocaleString()} Toman`, name];
                                                return [value, name];
                                            }}
                                        />
                                        <Legend />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fill="url(#colorRevenue2)"
                                            name="Revenue"
                                        />
                                        <Area
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="costToman"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            fill="url(#colorCost2)"
                                            name="AI Cost"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <p className="mt-2 text-xs text-gray-500 text-center">
                                    * AI Cost converted to Toman for comparison (1 USD ≈ 50,000 Toman)
                                </p>
                            </div>
                        </section>

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
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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

                        {/* AI Cost Analytics Section */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">AI Cost Analytics</h2>
                            <div className="grid gap-6">
                                {/* Cost Summary Cards */}
                                <div className="grid gap-6 md:grid-cols-3">
                                    {/* Total AI Cost */}
                                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
                                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-600">Total AI Cost</h3>
                                        <p className="mt-2 text-3xl font-bold text-black">
                                            ${costAnalytics.totalCost.toFixed(6)}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">USD</p>
                                    </div>

                                    {/* Average Cost Per User */}
                                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-sm">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-600">Avg Cost / User</h3>
                                        <p className="mt-2 text-3xl font-bold text-black">
                                            ${costAnalytics.avgCost.toFixed(6)}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">{costAnalytics.usersWithCost} users</p>
                                    </div>

                                    {/* Top User Cost */}
                                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-yellow-50/30 p-6 shadow-sm">
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/30">
                                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-600">Top User Cost</h3>
                                        <p className="mt-2 text-3xl font-bold text-black">
                                            ${costAnalytics.topUsers.length > 0 ? costAnalytics.topUsers[0].cost.toFixed(6) : '0.000000'}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {costAnalytics.topUsers.length > 0 ? costAnalytics.topUsers[0].name : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Cost Over Time Chart */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">AI Cost Over Time</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={costAnalytics.costOverTime}>
                                            <defs>
                                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                                                formatter={(value: number) => `$${value.toFixed(6)}`}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="totalCost"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                fill="url(#colorCost)"
                                                name="Total Cost (USD)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Top Users by Cost Table */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Top 10 Users by AI Cost</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                                                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                                                    <th className="pb-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                                    <th className="pb-3 text-right text-sm font-semibold text-gray-700">Cost (USD)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {costAnalytics.topUsers.map((user, index) => (
                                                    <tr key={user.phone} className="border-b border-gray-100 last:border-0">
                                                        <td className="py-3 text-sm text-gray-600">#{index + 1}</td>
                                                        <td className="py-3 text-sm font-medium text-gray-900">{user.phone}</td>
                                                        <td className="py-3 text-sm text-gray-600">{user.name}</td>
                                                        <td className="py-3 text-right text-sm font-semibold text-red-600">
                                                            ${user.cost.toFixed(6)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {costAnalytics.topUsers.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                                                            No cost data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Kitchen Analytics */}
                {!loading && !error && activeTab === 'kitchen' && kitchenAnalytics && (
                    <div className="space-y-8">
                        {/* Kitchen Summary Cards */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Kitchen Overview</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Total Clicks */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Total Clicks</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">
                                        {kitchenAnalytics.summary.totalClicks.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">All time</p>
                                </div>

                                {/* Unique Items Clicked */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Unique Items Clicked</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">
                                        {kitchenAnalytics.summary.uniqueItemsClicked.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">Different recipes</p>
                                </div>

                                {/* Unique Users */}
                                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-teal-50/30 p-6 shadow-sm">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">Unique Users</h3>
                                    <p className="mt-2 text-3xl font-bold text-black">
                                        {kitchenAnalytics.summary.uniqueUsersClicked.toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">Engaged with kitchen</p>
                                </div>
                            </div>
                        </section>

                        {/* Clicks Over Time Chart */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Clicks Over Time (Last 30 Days)</h2>
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={kitchenAnalytics.clicksOverTime.map(item => ({
                                        date: item._id,
                                        clicks: item.count
                                    }))}>
                                        <defs>
                                            <linearGradient id="colorKitchenClicks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickFormatter={(value) => value.split('-').slice(1).join('/')}
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
                                            dataKey="clicks"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            fill="url(#colorKitchenClicks)"
                                            name="Clicks"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* Category Breakdown */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Clicks by Category</h2>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Category Bar Chart */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Category Distribution</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={kitchenAnalytics.categorySummary} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                            <YAxis
                                                type="category"
                                                dataKey="categoryTitle"
                                                stroke="#6b7280"
                                                fontSize={12}
                                                width={120}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Bar dataKey="totalClicks" fill="#f97316" radius={[0, 8, 8, 0]} name="Clicks" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Category Pie Chart */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Category Share</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={kitchenAnalytics.categorySummary}
                                                dataKey="totalClicks"
                                                nameKey="categoryTitle"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label={({ categoryTitle, percent }) => `${categoryTitle} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {kitchenAnalytics.categorySummary.map((_entry, index) => (
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
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        {/* Top Clicked Items */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold text-black">Top Clicked Items</h2>
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="pb-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                                                <th className="pb-3 text-left text-sm font-semibold text-gray-700">Item Name</th>
                                                <th className="pb-3 text-left text-sm font-semibold text-gray-700">Category</th>
                                                <th className="pb-3 text-left text-sm font-semibold text-gray-700">Subcategory</th>
                                                <th className="pb-3 text-right text-sm font-semibold text-gray-700">Clicks</th>
                                                <th className="pb-3 text-right text-sm font-semibold text-gray-700">Unique Users</th>
                                                <th className="pb-3 text-right text-sm font-semibold text-gray-700">Last Clicked</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {kitchenAnalytics.topItems.slice(0, 20).map((item, index) => (
                                                <tr key={item._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                    <td className="py-3 text-sm text-gray-600">
                                                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index < 3
                                                                ? 'bg-orange-100 text-orange-600'
                                                                : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                                    <td className="py-3 text-sm text-gray-600">{item.categoryTitle}</td>
                                                    <td className="py-3 text-sm text-gray-600">{item.subCategoryTitle}</td>
                                                    <td className="py-3 text-right text-sm font-semibold text-orange-600">
                                                        {item.clickCount.toLocaleString()}
                                                    </td>
                                                    <td className="py-3 text-right text-sm text-gray-600">
                                                        {item.uniqueUserCount.toLocaleString()}
                                                    </td>
                                                    <td className="py-3 text-right text-sm text-gray-500">
                                                        {new Date(item.lastClicked).toLocaleDateString('fa-IR')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {kitchenAnalytics.topItems.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                                                        No click data available yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
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
