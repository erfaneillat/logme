import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { userService } from '../services/user.service';
import type { User } from '../types/user';
import { formatJalaliDate, formatJalaliTime } from '../utils/date';

const UsersPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isAdmin, setIsAdmin] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState<string>('');
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await userService.list({
          page,
          limit,
          search: search || undefined,
          sort: '-createdAt',
          isAdmin: isAdmin === '' ? undefined : isAdmin === 'true',
          isPhoneVerified: isPhoneVerified === '' ? undefined : isPhoneVerified === 'true',
        });
        if (!active) return;
        setItems(res.data.items);
        setTotal(res.data.pagination.total);
      } catch (e) {
        console.error('Failed to load users', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [page, limit, search, isAdmin, isPhoneVerified]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearch('');
    setIsAdmin('');
    setIsPhoneVerified('');
    setPage(1);
  };

  const activeFiltersCount = [search, isAdmin, isPhoneVerified].filter(Boolean).length;

  const handleDelete = async () => {
    if (!deleteModalUser) return;

    setDeleting(true);
    try {
      const res = await userService.delete(deleteModalUser._id);
      if (res.success) {
        // Remove from list
        setItems(prev => prev.filter(u => u._id !== deleteModalUser._id));
        setTotal(prev => prev - 1);
        setDeleteModalUser(null);
      } else {
        alert(res.message || 'Failed to delete user');
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-8 py-12">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3m-5-2a4 4 0 100-8 4 4 0 000 8zm-6 6h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-black">Users Management</h1>
                <p className="mt-2 text-base text-gray-600">
                  {loading ? 'Loading...' : `${total.toLocaleString()} total users`}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex space-x-3">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium text-gray-500">Active Filters</p>
                <p className="mt-1 text-2xl font-bold text-black">{activeFiltersCount}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Filters Section */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-black">Filters & Search</h2>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center space-x-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear All</span>
              </button>
            )}
          </div>

          <form onSubmit={onSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Search Input */}
            <div className="md:col-span-5">
              <label className="mb-2 block text-xs font-semibold text-gray-700">Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Name, phone, email, referral code..."
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-gray-700">Role</label>
              <select
                value={isAdmin}
                onChange={(e) => { setIsAdmin(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Roles</option>
                <option value="true">👑 Admin</option>
                <option value="false">👤 User</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div className="md:col-span-3">
              <label className="mb-2 block text-xs font-semibold text-gray-700">Verification</label>
              <select
                value={isPhoneVerified}
                onChange={(e) => { setIsPhoneVerified(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Status</option>
                <option value="true">✓ Verified</option>
                <option value="false">⏳ Unverified</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-gray-700">&nbsp;</label>
              <button
                type="submit"
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {/* Table Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-black">User List</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} of {total}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                    <div className="flex items-center space-x-1">
                      <span>User</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Activity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
                        <p className="text-sm font-medium text-gray-500">Loading users...</p>
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
                          <p className="text-base font-semibold text-gray-900">No users found</p>
                          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((u) => (
                    <tr key={u._id} className="transition-colors hover:bg-gray-50">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${u.hasActiveSubscription
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-2 ring-yellow-300'
                              : u.isAdmin
                                ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                                : 'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : u.phone.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-bold text-black">{u.name || 'Unnamed User'}</p>
                              {u.hasActiveSubscription && (
                                <span className="text-yellow-500" title="Premium Subscriber">
                                  👑
                                </span>
                              )}
                            </div>
                            {u.referralCode && (
                              <p className="mt-0.5 text-xs font-mono text-gray-500">
                                Ref: {u.referralCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-mono font-semibold text-gray-900">{u.phone}</p>
                          {u.email && (
                            <p className="text-xs text-gray-600">{u.email}</p>
                          )}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.hasActiveSubscription && (
                            <span className="inline-flex items-center space-x-1 rounded-lg bg-gradient-to-r from-yellow-100 to-yellow-200 px-2.5 py-1 text-xs font-bold text-yellow-800 ring-1 ring-yellow-300">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span>Premium</span>
                            </span>
                          )}
                          {u.isAdmin && (
                            <span className="inline-flex items-center space-x-1 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                              </svg>
                              <span>Admin</span>
                            </span>
                          )}
                          {u.isPhoneVerified ? (
                            <span className="inline-flex items-center space-x-1 rounded-lg bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 rounded-lg bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                            📊 {u.logCount || 0} logs
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{formatJalaliDate(u.createdAt)}</p>
                          <p className="text-xs text-gray-500">{formatJalaliTime(u.createdAt)}</p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/users/${u._id}`)}
                            className="group flex items-center space-x-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
                            title="View user details"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setDeleteModalUser(u)}
                            disabled={u.isAdmin}
                            className="group flex items-center space-x-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title={u.isAdmin ? 'Cannot delete admin users' : 'Delete user'}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
              {/* Page Info */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium text-black">{total.toLocaleString()}</span>
                <span>users total</span>
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
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
              {/* Modal Header */}
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Delete User</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              {/* User Info */}
              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${deleteModalUser.hasActiveSubscription
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-2 ring-yellow-300'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                    {deleteModalUser.name ? deleteModalUser.name.charAt(0).toUpperCase() : deleteModalUser.phone.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-black">{deleteModalUser.name || 'Unnamed User'}</p>
                      {deleteModalUser.hasActiveSubscription && (
                        <span className="text-yellow-500" title="Premium Subscriber">
                          👑
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-600">{deleteModalUser.phone}</p>
                  </div>
                </div>
              </div>

              <p className="mb-6 text-sm text-gray-700">
                Are you sure you want to delete this user? All associated data will be permanently removed.
              </p>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteModalUser(null)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete User</span>
                    </>
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

export default UsersPage;
