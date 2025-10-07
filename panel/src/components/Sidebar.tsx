import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavigationItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navigationItems: NavigationItem[] = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg>
            ),
        },
        {
            name: 'Subscription Plans',
            path: '/plans',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                </svg>
            ),
        },
    ];

    return (
        <aside className="flex h-screen w-72 flex-col border-r border-gray-200 bg-white">
            {/* Logo Section */}
            <div className="border-b border-gray-200 px-6 py-8">
                <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black shadow-lg">
                        <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-black">Cal AI</h1>
                        <p className="text-xs font-medium text-gray-500">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                    {navigationItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                                    ? 'bg-black text-white shadow-lg shadow-black/20'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-black active:scale-95'
                                    }`}
                            >
                                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                                    }`}>
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 px-2">
                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Quick Actions
                    </p>
                    <div className="space-y-2">
                        <button className="group flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-black">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            <span className="text-xs font-medium">Refresh Data</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* User Profile Section */}
            <div className="border-t border-gray-200 p-4">
                {/* User Info Card */}
                <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                    <div className="p-4">
                        <div className="mb-3 flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-semibold text-black">
                                    {user?.name || 'Admin'}
                                </p>
                                <p className="truncate text-xs text-gray-500">{user?.phone}</p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2 rounded-lg bg-green-50 px-3 py-2 text-xs">
                            <span className="flex h-2 w-2">
                                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                            </span>
                            <span className="font-semibold text-green-700">Active Admin</span>
                        </div>
                    </div>
                </div>

                {/* Sign Out Button */}
                <button
                    onClick={logout}
                    className="group flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-black hover:bg-black hover:text-white active:scale-95"
                >
                    <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

