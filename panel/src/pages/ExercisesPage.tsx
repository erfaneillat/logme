import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { exercisesService, ExerciseItem, ExerciseStats } from '../services/exercises.service';
import { formatJalaliDateTime, formatJalaliShortDate } from '../utils/date';

const ExercisesPage = () => {
    const { token } = useAuth();
    const [exercises, setExercises] = useState<ExerciseItem[]>([]);
    const [stats, setStats] = useState<ExerciseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterIntensity, setFilterIntensity] = useState<'all' | 'کم' | 'متوسط' | 'زیاد'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;

            try {
                setLoading(true);
                const [exercisesData, statsData] = await Promise.all([
                    exercisesService.getExercises(token, page, 20, filterIntensity === 'all' ? undefined : filterIntensity),
                    exercisesService.getExerciseStats(token),
                ]);

                setExercises(exercisesData.exercises);
                setTotalPages(exercisesData.pagination.totalPages);
                setStats(statsData);
                setError(null);
            } catch (err) {
                console.error('Error fetching exercises:', err);
                setError('Failed to load exercises');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, page, filterIntensity]);

    const handleSearch = async () => {
        if (!token || !searchTerm.trim()) return;

        try {
            setLoading(true);
            const exercisesData = await exercisesService.searchExercises(token, searchTerm, page, 20);
            setExercises(exercisesData.exercises);
            setTotalPages(exercisesData.pagination.totalPages);
            setError(null);
        } catch (err) {
            console.error('Error searching exercises:', err);
            setError('Failed to search exercises');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString: string) => {
        return formatJalaliDateTime(isoString);
    };

    const getIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'کم':
                return 'bg-green-100 text-green-700';
            case 'متوسط':
                return 'bg-yellow-100 text-yellow-700';
            case 'زیاد':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getIntensityLabel = (intensity: string) => {
        switch (intensity) {
            case 'کم':
                return 'Low';
            case 'متوسط':
                return 'Moderate';
            case 'زیاد':
                return 'High';
            default:
                return intensity;
        }
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-black">Exercise Logs</h1>
                                <p className="text-sm text-gray-500">View user exercise activities and burned calories</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Exercises</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{stats.totalExercises.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-orange-100 p-3">
                                        <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Calories Burned</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{stats.totalCaloriesBurned.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-red-100 p-3">
                                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Duration</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{formatDuration(stats.totalDuration)}</p>
                                    </div>
                                    <div className="rounded-xl bg-blue-100 p-3">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                                        <p className="mt-2 text-3xl font-bold text-black">{stats.uniqueUsers.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-xl bg-purple-100 p-3">
                                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Intensity Breakdown */}
                    {stats && (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold text-gray-600">Intensity Breakdown</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-xl bg-green-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-green-700">{stats.intensityBreakdown.low}</p>
                                    <p className="text-sm text-green-600">Low</p>
                                </div>
                                <div className="rounded-xl bg-yellow-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-yellow-700">{stats.intensityBreakdown.moderate}</p>
                                    <p className="text-sm text-yellow-600">Moderate</p>
                                </div>
                                <div className="rounded-xl bg-red-50 p-4 text-center">
                                    <p className="text-2xl font-bold text-red-700">{stats.intensityBreakdown.high}</p>
                                    <p className="text-sm text-red-600">High</p>
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
                                onClick={() => { setFilterIntensity('all'); setPage(1); }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterIntensity === 'all'
                                    ? 'bg-black text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => { setFilterIntensity('کم'); setPage(1); }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterIntensity === 'کم'
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                Low
                            </button>
                            <button
                                onClick={() => { setFilterIntensity('متوسط'); setPage(1); }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterIntensity === 'متوسط'
                                    ? 'bg-yellow-600 text-white shadow-lg'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    }`}
                            >
                                Moderate
                            </button>
                            <button
                                onClick={() => { setFilterIntensity('زیاد'); setPage(1); }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filterIntensity === 'زیاد'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                            >
                                High
                            </button>
                        </div>

                        {/* Search */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search by user or activity..."
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

                {/* Exercises Grid */}
                {!loading && !error && (
                    <div className="space-y-4">
                        {exercises.map((exercise) => (
                            <div
                                key={exercise._id}
                                onClick={() => setSelectedExercise(exercise)}
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
                                                    <p className="font-semibold text-black">{exercise.userName || 'Unknown User'}</p>
                                                    <p className="text-sm text-gray-500">{exercise.userPhone}</p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getIntensityColor(exercise.intensity)}`}>
                                                    🏃 {getIntensityLabel(exercise.intensity)}
                                                </span>
                                            </div>

                                            {/* Exercise Info */}
                                            <div className="mb-4">
                                                <h3 className="mb-2 text-xl font-bold text-black">{exercise.activityName}</h3>
                                                {exercise.activityDescription && exercise.activityDescription !== exercise.activityName && (
                                                    <p className="mb-2 text-sm text-gray-600">{exercise.activityDescription}</p>
                                                )}
                                                <div className="flex flex-wrap gap-3">
                                                    <span className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                                                        🔥 {exercise.caloriesBurned} cal burned
                                                    </span>
                                                    <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                                        ⏱️ {formatDuration(exercise.duration)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <p className="text-sm text-gray-500">{formatDate(exercise.timeIso)}</p>
                                        </div>

                                        {/* Exercise Icon */}
                                        <div className="ml-6 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100">
                                            <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {exercises.length === 0 && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                                <p className="text-gray-500">No exercises found</p>
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
                {selectedExercise && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setSelectedExercise(null)}
                    >
                        <div
                            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-6 flex items-start justify-between">
                                <h2 className="text-2xl font-bold text-black">{selectedExercise.activityName}</h2>
                                <button
                                    onClick={() => setSelectedExercise(null)}
                                    className="rounded-xl p-2 transition-all hover:bg-gray-100"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Activity Icon */}
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-red-100">
                                    <svg className="h-12 w-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>

                            {selectedExercise.activityDescription && selectedExercise.activityDescription !== selectedExercise.activityName && (
                                <div className="mb-6">
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">Description</h3>
                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-sm text-gray-700 leading-relaxed">{selectedExercise.activityDescription}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">Exercise Stats</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-xl bg-red-50 p-4">
                                            <p className="text-sm text-gray-600">Calories Burned</p>
                                            <p className="text-2xl font-bold text-black">{selectedExercise.caloriesBurned}</p>
                                        </div>
                                        <div className="rounded-xl bg-blue-50 p-4">
                                            <p className="text-sm text-gray-600">Duration</p>
                                            <p className="text-2xl font-bold text-black">{formatDuration(selectedExercise.duration)}</p>
                                        </div>
                                        <div className={`rounded-xl p-4 ${getIntensityColor(selectedExercise.intensity)}`}>
                                            <p className="text-sm opacity-80">Intensity</p>
                                            <p className="text-2xl font-bold">{getIntensityLabel(selectedExercise.intensity)}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-semibold text-gray-600">Tips</h3>
                                        <div className="space-y-2">
                                            {selectedExercise.tips.map((tip, index) => (
                                                <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                    <p className="text-sm text-gray-700">💡 {tip}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="mb-2 text-sm font-semibold text-gray-600">User Details</h3>
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <p className="text-sm text-gray-600">Name: <span className="font-semibold text-black">{selectedExercise.userName || 'N/A'}</span></p>
                                        <p className="text-sm text-gray-600">Phone: <span className="font-semibold text-black">{selectedExercise.userPhone}</span></p>
                                        <p className="text-sm text-gray-600">Date: <span className="font-semibold text-black">{formatJalaliShortDate(selectedExercise.date)}</span></p>
                                        <p className="text-sm text-gray-600">Time: <span className="font-semibold text-black">{formatDate(selectedExercise.timeIso)}</span></p>
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

export default ExercisesPage;
