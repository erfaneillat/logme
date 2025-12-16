import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { logsService, LogItem, LogStats } from '../services/logs.service';
import { formatJalaliDateTime, formatJalaliShortDate } from '../utils/date';

const LogsPage = () => {
    const { token } = useAuth();
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterType, setFilterType] = useState<'all' | 'image' | 'text'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;

            try {
                setLoading(true);
                const [logsData, statsData] = await Promise.all([
                    logsService.getLogs(token, page, 20, filterType === 'all' ? undefined : filterType),
                    logsService.getLogStats(token),
                ]);

                setLogs(logsData.logs);
                setTotalPages(logsData.pagination.totalPages);
                setStats(statsData);
                setError(null);
            } catch (err) {
                console.error('Error fetching logs:', err);
                setError('Failed to load logs');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, page, filterType]);

    const handleSearch = async () => {
        if (!token || !searchTerm.trim()) return;

        try {
            setLoading(true);
            const logsData = await logsService.searchLogs(token, searchTerm, page, 20);
            setLogs(logsData.logs);
            setTotalPages(logsData.pagination.totalPages);
            setError(null);
        } catch (err) {
            console.error('Error searching logs:', err);
            setError('Failed to search logs');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString: string) => {
        return formatJalaliDateTime(isoString);
    };

    const getHealthScoreColor = (score?: number) => {
        if (!score) return 'bg-gray-100 text-gray-600';
        if (score >= 8) return 'bg-green-100 text-green-700';
        if (score >= 5) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-black">Food Logs</h1>
                                <p className="text-sm text-gray-500">View user submissions and AI responses</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Logs</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{stats.totalLogs.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-blue-100 p-3">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Items</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{stats.totalItems.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-purple-100 p-3">
                                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white border border-green-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Image Analyses</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{stats.imageAnalyses.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-green-100 p-3">
                                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Text Analyses</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{stats.textAnalyses.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-orange-100 p-3">
                                        <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* Filters and Search */}
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Filter Tabs */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => { setFilterType('all'); setPage(1); }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterType === 'all'
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => { setFilterType('image'); setPage(1); }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterType === 'image'
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Images
                            </button>
                            <button
                                onClick={() => { setFilterType('text'); setPage(1); }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterType === 'text'
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Text
                            </button>
                        </div>

                        {/* Search */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search by user or food..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                            <button
                                onClick={handleSearch}
                                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-95"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Logs Grid */}
                {!loading && !error && (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div
                                key={log._id}
                                onClick={() => setSelectedLog(log)}
                                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-black hover:shadow-lg"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* User Info */}
                                            <div className="mb-4 flex items-center space-x-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                                                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-black">{log.userName || 'Unknown User'}</p>
                                                    <p className="text-sm text-gray-500">{log.userPhone}</p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${log.type === 'image' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {log.type === 'image' ? '📷 Image' : '📝 Text'}
                                                </span>
                                            </div>

                                            {/* Food Info */}
                                            <div className="mb-4">
                                                <h3 className="mb-2 text-xl font-bold text-black">{log.title}</h3>
                                                <div className="flex flex-wrap gap-3">
                                                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                                        🔥 {log.calories} cal
                                                    </span>
                                                    <span className="rounded-lg bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-700">
                                                        🍞 {log.carbsGrams}g carbs
                                                    </span>
                                                    <span className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                                                        🥩 {log.proteinGrams}g protein
                                                    </span>
                                                    <span className="rounded-lg bg-yellow-50 px-3 py-1 text-sm font-semibold text-yellow-700">
                                                        🧈 {log.fatsGrams}g fat
                                                    </span>
                                                    {log.healthScore && (
                                                        <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${getHealthScoreColor(log.healthScore)}`}>
                                                            ⭐ Health: {log.healthScore}/10
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <p className="text-sm text-gray-500">{formatDate(log.timeIso)}</p>
                                        </div>

                                        {/* Image Preview */}
                                        {log.imageUrl && (
                                            <div className="ml-6 h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                                                <img
                                                    src={log.imageUrl}
                                                    alt={log.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {logs.length === 0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                                <p className="text-gray-500">No logs found</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center space-x-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm font-semibold text-gray-700">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedLog && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setSelectedLog(null)}
                    >
                        <div
                            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-6 flex items-start justify-between">
                                <h2 className="text-2xl font-bold text-black">{selectedLog.title}</h2>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="rounded-xl p-2 transition-all hover:bg-gray-100"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {selectedLog.imageUrl && (
                                <div className="mb-6 overflow-hidden rounded-xl">
                                    <img
                                        src={selectedLog.imageUrl}
                                        alt={selectedLog.title}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {selectedLog.description && (
                                <div className="mb-6">
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">User's Description</h3>
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-start gap-2">
                                            <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm text-gray-700 leading-relaxed">{selectedLog.description}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">Nutritional Info</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-blue-50 p-4">
                                            <p className="text-sm text-gray-600">Calories</p>
                                            <p className="text-2xl font-bold text-black">{selectedLog.calories}</p>
                                        </div>
                                        <div className="rounded-xl bg-purple-50 p-4">
                                            <p className="text-sm text-gray-600">Carbs</p>
                                            <p className="text-2xl font-bold text-black">{selectedLog.carbsGrams}g</p>
                                        </div>
                                        <div className="rounded-xl bg-red-50 p-4">
                                            <p className="text-sm text-gray-600">Protein</p>
                                            <p className="text-2xl font-bold text-black">{selectedLog.proteinGrams}g</p>
                                        </div>
                                        <div className="rounded-xl bg-yellow-50 p-4">
                                            <p className="text-sm text-gray-600">Fat</p>
                                            <p className="text-2xl font-bold text-black">{selectedLog.fatsGrams}g</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedLog.ingredients && selectedLog.ingredients.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-gray-600">Ingredients</h3>
                                        <div className="space-y-2">
                                            {selectedLog.ingredients.map((ingredient, index) => (
                                                <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                    <p className="font-semibold text-black">{ingredient.name}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                                                        <span>{ingredient.calories} cal</span>
                                                        <span>•</span>
                                                        <span>{ingredient.carbsGrams}g carbs</span>
                                                        <span>•</span>
                                                        <span>{ingredient.proteinGrams}g protein</span>
                                                        <span>•</span>
                                                        <span>{ingredient.fatGrams}g fat</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">User Details</h3>
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <p className="text-sm text-gray-600">Name: <span className="font-semibold text-black">{selectedLog.userName || 'N/A'}</span></p>
                                        <p className="text-sm text-gray-600">Phone: <span className="font-semibold text-black">{selectedLog.userPhone}</span></p>
                                        <p className="text-sm text-gray-600">Date: <span className="font-semibold text-black">{formatJalaliShortDate(selectedLog.date)}</span></p>
                                        <p className="text-sm text-gray-600">Time: <span className="font-semibold text-black">{formatDate(selectedLog.timeIso)}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default LogsPage;
