import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { errorLogService, ErrorLogItem, ErrorLogStats } from '../services/errorLog.service';
import { formatJalaliDateTime } from '../utils/date';

const ErrorLogsPage = () => {
    const { token } = useAuth();
    const [logs, setLogs] = useState<ErrorLogItem[]>([]);
    const [stats, setStats] = useState<ErrorLogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterLevel, setFilterLevel] = useState<'all' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'>('all');
    const [selectedLog, setSelectedLog] = useState<ErrorLogItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;

            try {
                setLoading(true);
                if (filterLevel === 'all') {
                    const [infoData, warningData, errorData, criticalData, statsData] = await Promise.all([
                        errorLogService.getErrorLogs(token, page, 50, 'INFO'),
                        errorLogService.getErrorLogs(token, page, 50, 'WARNING'),
                        errorLogService.getErrorLogs(token, page, 50, 'ERROR'),
                        errorLogService.getErrorLogs(token, page, 50, 'CRITICAL'),
                        errorLogService.getErrorLogStats(token),
                    ]);

                    const merged = [...infoData.logs, ...warningData.logs, ...errorData.logs, ...criticalData.logs]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    const pageLogs = merged.slice(0, 50);

                    setLogs(pageLogs);
                    setTotalPages(merged.length >= 50 ? page + 1 : page);
                    setStats(statsData);
                    setError(null);
                } else {
                    const [logsData, statsData] = await Promise.all([
                        errorLogService.getErrorLogs(token, page, 50, filterLevel),
                        errorLogService.getErrorLogStats(token),
                    ]);

                    setLogs(logsData.logs);
                    setTotalPages(logsData.logs.length >= 50 ? page + 1 : page);
                    setStats(statsData);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching error logs:', err);
                setError('Failed to load error logs');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, page, filterLevel]);

    const formatDate = (isoString: string) => {
        return formatJalaliDateTime(isoString);
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'INFO':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'WARNING':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ERROR':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'CRITICAL':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'INFO':
                return 'ℹ️';
            case 'WARNING':
                return '⚠️';
            case 'ERROR':
                return '❌';
            case 'CRITICAL':
                return '🔥';
            default:
                return '📝';
        }
    };

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-black">Error Logs</h1>
                                <p className="text-sm text-gray-500">Monitor system errors and warnings</p>
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
                                        <p className="mt-2 text-3xl font-bold text-black">{(stats?.total ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-blue-100 p-3">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Errors</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{(stats?.byLevel?.ERROR ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-red-100 p-3">
                                        <span className="text-2xl">❌</span>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Critical</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{(stats?.byLevel?.CRITICAL ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-purple-100 p-3">
                                        <span className="text-2xl">🔥</span>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Last 24h</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{(stats?.last24Hours ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-yellow-100 p-3">
                                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* Filters */}
                <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { setFilterLevel('all'); setPage(1); }}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterLevel === 'all'
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => { setFilterLevel('INFO'); setPage(1); }}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterLevel === 'INFO'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                        >
                            ℹ️ Info
                        </button>
                        <button
                            onClick={() => { setFilterLevel('WARNING'); setPage(1); }}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterLevel === 'WARNING'
                                    ? 'bg-yellow-600 text-white shadow-lg'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                }`}
                        >
                            ⚠️ Warning
                        </button>
                        <button
                            onClick={() => { setFilterLevel('ERROR'); setPage(1); }}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterLevel === 'ERROR'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                        >
                            ❌ Error
                        </button>
                        <button
                            onClick={() => { setFilterLevel('CRITICAL'); setPage(1); }}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterLevel === 'CRITICAL'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                }`}
                        >
                            🔥 Critical
                        </button>
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

                {/* Logs List */}
                {!loading && !error && (
                    <div className="space-y-3">
                        {logs.map((log, idx) => (
                            <div
                                key={log._id ?? `${log.timestamp}-${idx}`}
                                onClick={() => setSelectedLog(log)}
                                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-black hover:shadow-lg"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center space-x-3">
                                                <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${getLevelColor(log.level)}`}>
                                                    {getLevelIcon(log.level)} {log.level}
                                                </span>
                                                {log.context?.controller && (
                                                    <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                        {log.context.controller}
                                                    </span>
                                                )}
                                                {log.context?.service && (
                                                    <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                        {log.context.service}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mb-2 font-semibold text-black">{log.message}</p>
                                            {log.error && (
                                                <p className="mb-2 text-sm text-red-600">{log.error.name}: {log.error.message}</p>
                                            )}
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span>{formatDate(log.timestamp)}</span>
                                                {log.request && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{log.request.method} {log.request.url}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {logs.length === 0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                                <p className="text-gray-500">No error logs found</p>
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
                            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-6 flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className={`rounded-lg border px-3 py-1 text-sm font-bold ${getLevelColor(selectedLog.level)}`}>
                                        {getLevelIcon(selectedLog.level)} {selectedLog.level}
                                    </span>
                                    <h2 className="text-xl font-bold text-black">Error Details</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="rounded-xl p-2 transition-all hover:bg-gray-100"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">Message</h3>
                                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-black">{selectedLog.message}</p>
                                </div>

                                {selectedLog.error && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-gray-600">Error</h3>
                                        <div className="rounded-xl bg-red-50 p-4">
                                            <p className="mb-1 text-sm font-semibold text-red-700">{selectedLog.error.name}</p>
                                            <p className="mb-2 text-sm text-red-600">{selectedLog.error.message}</p>
                                            {selectedLog.error.stack && (
                                                <pre className="mt-2 overflow-x-auto rounded-lg bg-red-100 p-3 text-xs text-red-800">
                                                    {selectedLog.error.stack}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-gray-600">Context</h3>
                                        <pre className="overflow-x-auto rounded-xl bg-gray-50 p-4 text-xs text-gray-800">
                                            {JSON.stringify(selectedLog.context, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {selectedLog.request && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-gray-600">Request</h3>
                                        <div className="rounded-xl bg-blue-50 p-4 text-sm">
                                            <p><span className="font-semibold">Method:</span> {selectedLog.request.method}</p>
                                            <p><span className="font-semibold">URL:</span> {selectedLog.request.url}</p>
                                            {selectedLog.request.ip && <p><span className="font-semibold">IP:</span> {selectedLog.request.ip}</p>}
                                            {selectedLog.request.userAgent && <p className="break-all"><span className="font-semibold">User Agent:</span> {selectedLog.request.userAgent}</p>}
                                        </div>
                                    </div>
                                )}

                                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-gray-600">Metadata</h3>
                                        <pre className="overflow-x-auto rounded-xl bg-gray-50 p-4 text-xs text-gray-800">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">Timestamp</h3>
                                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-black">{formatDate(selectedLog.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ErrorLogsPage;
