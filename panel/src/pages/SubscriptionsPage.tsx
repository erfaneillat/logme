import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { subscriptionService } from '../services/subscription.service';
import type { Subscription } from '../types/subscription';

const SubscriptionsPage = () => {
  const [items, setItems] = useState<Subscription[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [planType, setPlanType] = useState<'' | 'monthly' | 'yearly'>('');
  const [isActive, setIsActive] = useState<string>('');
  const [extendModal, setExtendModal] = useState<{ subscription: Subscription; days: number } | null>(null);
  const [cancelModal, setCancelModal] = useState<Subscription | null>(null);
  const [processing, setProcessing] = useState(false);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await subscriptionService.listAll({
          page,
          limit,
          search: search || undefined,
          sort: '-createdAt',
          planType: planType || undefined,
          isActive: isActive || undefined,
        });
        if (!active) return;
        setItems(res.data.items);
        setTotal(res.data.pagination.total);
      } catch (e) {
        console.error('Failed to load subscriptions', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [page, limit, search, planType, isActive]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearch('');
    setPlanType('');
    setIsActive('');
    setPage(1);
  };

  const activeFiltersCount = [search, planType, isActive].filter(Boolean).length;

  const handleCancel = async () => {
    if (!cancelModal) return;
    setProcessing(true);
    try {
      const res = await subscriptionService.cancel(cancelModal._id);
      if (res.success) {
        setItems(prev => prev.map(s => s._id === cancelModal._id ? { ...s, isActive: false, autoRenew: false } : s));
        setCancelModal(null);
      } else {
        alert(res.message || 'Failed to cancel subscription');
      }
    } catch (e) {
      console.error('Cancel error:', e);
      alert('Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleExtend = async () => {
    if (!extendModal) return;
    setProcessing(true);
    try {
      const res = await subscriptionService.extend(extendModal.subscription._id, extendModal.days);
      if (res.success && res.data) {
        setItems(prev => prev.map(s => s._id === extendModal.subscription._id ? { ...s, expiryDate: res.data!.newExpiryDate } : s));
        setExtendModal(null);
      } else {
        alert(res.message || 'Failed to extend subscription');
      }
    } catch (e) {
      console.error('Extend error:', e);
      alert('Failed to extend subscription');
    } finally {
      setProcessing(false);
    }
  };

  const getUserInfo = (sub: Subscription) => {
    if (typeof sub.userId === 'object') return sub.userId;
    return sub.user;
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-8 py-12">
        <header className="mb-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-black">Subscriptions</h1>
                <p className="mt-2 text-base text-gray-600">
                  {loading ? 'Loading...' : `${total.toLocaleString()} total subscriptions`}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium text-gray-500">Active Filters</p>
                <p className="mt-1 text-2xl font-bold text-black">{activeFiltersCount}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-black">Filters & Search</h2>
            {activeFiltersCount > 0 && (
              <button type="button" onClick={handleReset} className="flex items-center space-x-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear All</span>
              </button>
            )}
          </div>

          <form onSubmit={onSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="mb-2 block text-xs font-semibold text-gray-700">Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="User name, phone, email, order ID..." className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-gray-700">Plan Type</label>
              <select value={planType} onChange={(e) => { setPlanType(e.target.value as any); setPage(1); }} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                <option value="">All Plans</option>
                <option value="monthly">📅 Monthly</option>
                <option value="yearly">📆 Yearly</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-2 block text-xs font-semibold text-gray-700">Status</label>
              <select value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                <option value="">All Status</option>
                <option value="true">✓ Active</option>
                <option value="false">✗ Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-gray-700">&nbsp;</label>
              <button type="submit" className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">Subscription List</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} of {total}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600"></div>
                        <p className="text-sm font-medium text-gray-500">Loading subscriptions...</p>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-semibold text-gray-900">No subscriptions found</p>
                          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((sub) => {
                    const user = getUserInfo(sub);
                    const expired = isExpired(sub.expiryDate);
                    return (
                      <tr key={sub._id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
                              {user?.name ? user.name.charAt(0).toUpperCase() : user?.phone.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-black">{user?.name || 'Unnamed User'}</p>
                              <p className="text-xs font-mono text-gray-500">{user?.phone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-bold ${sub.planType === 'yearly' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            <span>{sub.planType === 'yearly' ? '📆' : '📅'}</span>
                            <span className="capitalize">{sub.planType}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {sub.isActive && !expired ? (
                              <span className="inline-flex items-center space-x-1 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Active</span>
                              </span>
                            ) : expired ? (
                              <span className="inline-flex items-center space-x-1 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>Expired</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                                <span>Inactive</span>
                              </span>
                            )}
                            {sub.autoRenew && (
                              <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                                🔄 Auto-renew
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="font-medium text-gray-500">Start:</span>
                              <span className="ml-1 text-gray-900">{new Date(sub.startDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Expiry:</span>
                              <span className={`ml-1 font-semibold ${expired ? 'text-red-600' : 'text-gray-900'}`}>
                                {new Date(sub.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-xs font-mono text-gray-600">{sub.orderId}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button onClick={() => setExtendModal({ subscription: sub, days: 30 })} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100">
                              Extend
                            </button>
                            {sub.isActive && (
                              <button onClick={() => setCancelModal(sub)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium text-black">{total.toLocaleString()}</span>
                <span>subscriptions total</span>
                <span className="text-gray-400">•</span>
                <span>Page</span>
                <span className="font-semibold text-black">{page}</span>
                <span>of</span>
                <span className="font-semibold text-black">{totalPages}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Per page:</label>
                  <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value) || 20); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <span>Next</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extend Modal */}
        {extendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Extend Subscription</h3>
                  <p className="text-sm text-gray-600">Add extra days to the subscription</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Number of Days</label>
                <input type="number" min="1" value={extendModal.days} onChange={(e) => setExtendModal({ ...extendModal, days: parseInt(e.target.value) || 1 })} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setExtendModal(null)} disabled={processing} className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleExtend} disabled={processing} className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50">
                  {processing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Extending...</span>
                    </>
                  ) : (
                    <span>Extend</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Cancel Subscription</h3>
                  <p className="text-sm text-gray-600">This will deactivate the subscription</p>
                </div>
              </div>

              <p className="mb-6 text-sm text-gray-700">
                Are you sure you want to cancel this subscription? The user will lose access to premium features.
              </p>

              <div className="flex space-x-3">
                <button onClick={() => setCancelModal(null)} disabled={processing} className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50">
                  No, Keep It
                </button>
                <button onClick={handleCancel} disabled={processing} className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50">
                  {processing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Yes, Cancel</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionsPage;
