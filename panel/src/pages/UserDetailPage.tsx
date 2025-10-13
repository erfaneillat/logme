import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { userService } from '../services/user.service';
import { logsService, LogItem } from '../services/logs.service';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types/user';

const UserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);

  useEffect(() => {
    if (!userId) return;
    
    let active = true;
    const fetchUser = async () => {
      setUserLoading(true);
      try {
        const res = await userService.getById(userId);
        if (!active) return;
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          alert('Failed to load user');
          navigate('/users');
        }
      } catch (e) {
        console.error('Failed to load user', e);
        alert('Failed to load user');
        navigate('/users');
      } finally {
        if (active) setUserLoading(false);
      }
    };
    fetchUser();
    return () => { active = false; };
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId || !token) return;
    
    let active = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await logsService.getUserLogs(token, userId, page, limit);
        if (!active) return;
        setLogs(res.logs);
        setTotal(res.pagination.total);
      } catch (e) {
        console.error('Failed to load logs', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLogs();
    return () => { active = false; };
  }, [userId, token, page, limit]);

  if (userLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-7xl px-8 py-12">
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/users')}
          className="mb-6 flex items-center space-x-2 text-gray-600 transition-colors hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Users</span>
        </button>

        {/* User Header Card */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full font-bold text-white ring-4 ring-white ${
                user.hasActiveSubscription 
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                  : user.isAdmin 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`} style={{ fontSize: '32px' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : user.phone.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-white">{user.name || 'Unnamed User'}</h1>
                  {user.hasActiveSubscription && (
                    <span className="text-2xl" title="Premium Subscriber">
                      👑
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-lg text-indigo-100">{user.phone}</p>
                {user.email && (
                  <p className="mt-0.5 text-sm text-indigo-100">{user.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Status Section */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Status</h3>
              <div className="flex flex-wrap gap-2">
                {user.hasActiveSubscription && (
                  <span className="inline-flex items-center space-x-1 rounded-lg bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-1.5 text-xs font-bold text-yellow-800 ring-1 ring-yellow-300">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Premium</span>
                  </span>
                )}
                {user.isAdmin && (
                  <span className="inline-flex items-center space-x-1 rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    <span>Admin</span>
                  </span>
                )}
                {user.isPhoneVerified ? (
                  <span className="inline-flex items-center space-x-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-700">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Pending</span>
                  </span>
                )}
              </div>
            </div>

            {/* Activity Section */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-semibold text-gray-900">📊 Logs:</span>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold text-indigo-700">
                    {user.logCount || 0}
                  </span>
                </div>
                {user.streakCount !== undefined && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold text-gray-900">🔥 Streak:</span>
                    <span className="rounded bg-orange-100 px-2 py-0.5 font-bold text-orange-700">
                      {user.streakCount} days
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Referral Section */}
            {user.referralCode && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Referral</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold text-gray-900">Code:</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono font-bold text-gray-700">
                      {user.referralCode}
                    </span>
                  </div>
                  {user.referralSuccessCount !== undefined && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-semibold text-gray-900">Success:</span>
                      <span className="rounded bg-green-100 px-2 py-0.5 font-bold text-green-700">
                        {user.referralSuccessCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates Section */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Timeline</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">Joined</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs">{new Date(user.createdAt).toLocaleTimeString()}</p>
                </div>
                {user.lastActivity && (
                  <div>
                    <p className="font-semibold text-gray-900">Last Activity</p>
                    <p>{new Date(user.lastActivity).toLocaleDateString()}</p>
                    <p className="text-xs">{new Date(user.lastActivity).toLocaleTimeString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className={user.addBurnedCalories ? 'text-green-600' : 'text-gray-400'}>
                    {user.addBurnedCalories ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700">Add Burned Calories</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={user.rolloverCalories ? 'text-green-600' : 'text-gray-400'}>
                    {user.rolloverCalories ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700">Rollover Calories</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={user.hasCompletedAdditionalInfo ? 'text-green-600' : 'text-gray-400'}>
                    {user.hasCompletedAdditionalInfo ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700">Additional Info Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={user.hasGeneratedPlan ? 'text-green-600' : 'text-gray-400'}>
                    {user.hasGeneratedPlan ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700">Plan Generated</span>
                </div>
              </div>
            </div>

            {/* AI Cost Section */}
            {user.aiCostUsdTotal !== undefined && user.aiCostUsdTotal > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">AI Usage</h3>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">Total Cost:</span>
                  <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-700">
                    ${user.aiCostUsdTotal.toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs Section */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* Logs Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">User Logs</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {logs.length > 0 ? `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, total)} of ${total}` : 'No logs'}
                </span>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Food</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Nutrition</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Health Score</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Image</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
                        <p className="text-sm font-medium text-gray-500">Loading logs...</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-semibold text-gray-900">No logs found</p>
                          <p className="mt-1 text-sm text-gray-500">This user hasn't logged any meals yet</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{new Date(log.timeIso).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{new Date(log.timeIso).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                          log.type === 'image'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.type === 'image' ? '📷' : '✏️'} {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="truncate text-sm font-semibold text-gray-900">{log.title}</p>
                          {log.portions && log.portions > 1 && (
                            <p className="text-xs text-gray-500">{log.portions} portions</p>
                          )}
                          {log.liked && (
                            <span className="mt-1 inline-block text-xs">❤️ Liked</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-700">Cal:</span>
                            <span className="rounded bg-orange-100 px-1.5 py-0.5 font-bold text-orange-700">
                              {log.calories}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <span>P: {log.proteinGrams}g</span>
                            <span>•</span>
                            <span>C: {log.carbsGrams}g</span>
                            <span>•</span>
                            <span>F: {log.fatsGrams}g</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.healthScore !== undefined ? (
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                            log.healthScore >= 80
                              ? 'bg-green-100 text-green-700'
                              : log.healthScore >= 60
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {log.healthScore}/100
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {log.imageUrl ? (
                          <a
                            href={log.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block h-16 w-16 overflow-hidden rounded-lg ring-2 ring-gray-200 transition-all hover:ring-indigo-500"
                          >
                            <img
                              src={log.imageUrl}
                              alt={log.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                          </a>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
                {/* Page Info */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium text-black">{total.toLocaleString()}</span>
                  <span>logs total</span>
                  <span className="text-gray-400">•</span>
                  <span>Page</span>
                  <span className="font-semibold text-black">{page}</span>
                  <span>of</span>
                  <span className="font-semibold text-black">{totalPages}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-3">
                  {/* Per Page Selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Per page:</label>
                    <select
                      value={limit}
                      onChange={(e) => { setLimit(parseInt(e.target.value) || 20); setPage(1); }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>Next</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserDetailPage;
