import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlanService } from '../services/subscriptionPlan.service';
import { SubscriptionPlan } from '../types/subscriptionPlan';
import Layout from '../components/Layout';

const PlansPage = () => {
    const { token } = useAuth();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [price, setPrice] = useState<number>(0);
    const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
    const [discountPercentage, setDiscountPercentage] = useState<number | undefined>(undefined);
    const [pricePerMonth, setPricePerMonth] = useState<number | undefined>(undefined);
    const [cafebazaarProductKey, setCafebazaarProductKey] = useState<string>('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        if (!token) return;

        setLoading(true);
        const response = await subscriptionPlanService.getAllPlans(token, false);
        if (response.success && response.data) {
            setPlans(response.data.plans);
        } else {
            setError(response.message || 'Failed to fetch plans');
        }
        setLoading(false);
    };

    const handleOpenModal = (plan: SubscriptionPlan) => {
        setEditingPlan(plan);
        setPrice(plan.price);
        setOriginalPrice(plan.originalPrice);
        setDiscountPercentage(plan.discountPercentage);
        setPricePerMonth(plan.pricePerMonth);
        setCafebazaarProductKey(plan.cafebazaarProductKey || '');
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlan(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !editingPlan) return;

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await subscriptionPlanService.updatePlanPrice(
                token,
                editingPlan.duration as 'monthly' | 'yearly',
                {
                    price,
                    originalPrice: originalPrice || undefined,
                    discountPercentage: discountPercentage || undefined,
                    pricePerMonth: pricePerMonth || undefined,
                    cafebazaarProductKey: cafebazaarProductKey || undefined,
                }
            );

            if (response.success) {
                setSuccess('Price updated successfully!');
                await fetchPlans();
                setTimeout(() => {
                    handleCloseModal();
                    setSuccess('');
                }, 1500);
            } else {
                setError(response.message || 'Failed to update price');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    const monthlyPlan = plans.find((p) => p.duration === 'monthly');
    const yearlyPlan = plans.find((p) => p.duration === 'yearly');

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="mb-6 flex items-center space-x-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-black">Subscription Plans</h1>
                            <p className="mt-1 text-base text-gray-600">Edit pricing for monthly and yearly plans</p>
                        </div>
                    </div>
                </header>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 flex items-center space-x-3 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3.5 text-green-800">
                        <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">{success}</span>
                    </div>
                )}
                {error && !showModal && (
                    <div className="mb-6 flex items-center space-x-3 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3.5 text-red-800">
                        <svg className="h-5 w-5 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Plans Grid */}
                {loading && plans.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-4 text-sm font-medium text-gray-600">Loading plans...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Yearly Plan */}
                        {yearlyPlan && (
                            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50/30 p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                                <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-purple-200 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-40"></div>

                                <div className="relative">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-black">{yearlyPlan.name}</h3>
                                        <span className="rounded-full bg-purple-100 px-4 py-1.5 text-xs font-bold text-purple-700">
                                            YEARLY
                                        </span>
                                    </div>

                                    <div className="mb-8 space-y-3">
                                        <div className="text-4xl font-bold text-black">{formatPrice(yearlyPlan.price)}</div>
                                        {yearlyPlan.originalPrice && (
                                            <div className="text-base text-gray-500 line-through">
                                                {formatPrice(yearlyPlan.originalPrice)}
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-3">
                                            {yearlyPlan.discountPercentage && (
                                                <div className="inline-flex items-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-red-500/30">
                                                    {yearlyPlan.discountPercentage}% OFF
                                                </div>
                                            )}
                                            {yearlyPlan.pricePerMonth && (
                                                <div className="text-sm font-medium text-gray-600">
                                                    {formatPrice(yearlyPlan.pricePerMonth)}/month
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleOpenModal(yearlyPlan)}
                                        className="w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30 active:scale-[0.98]"
                                    >
                                        Edit Pricing
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Monthly Plan */}
                        {monthlyPlan && (
                            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                                <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-blue-200 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-40"></div>

                                <div className="relative">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-black">{monthlyPlan.name}</h3>
                                        <span className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700">
                                            MONTHLY
                                        </span>
                                    </div>

                                    <div className="mb-8">
                                        <div className="text-4xl font-bold text-black">{formatPrice(monthlyPlan.price)}</div>
                                    </div>

                                    <button
                                        onClick={() => handleOpenModal(monthlyPlan)}
                                        className="w-full rounded-xl bg-black px-6 py-3.5 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30 active:scale-[0.98]"
                                    >
                                        Edit Pricing
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit Modal */}
                {showModal && editingPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
                            <div className="mb-6 flex items-center space-x-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-black to-gray-800 shadow-lg">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-black">
                                    Edit {editingPlan.name}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">Price (Toman)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        required
                                        min="0"
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">
                                        Cafebazaar Product Key (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={cafebazaarProductKey}
                                        onChange={(e) => setCafebazaarProductKey(e.target.value)}
                                        placeholder="e.g., monthly_plan or yearly_plan"
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                </div>

                                {editingPlan.duration === 'yearly' && (
                                    <>
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-black">
                                                Original Price (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                value={originalPrice || ''}
                                                onChange={(e) =>
                                                    setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)
                                                }
                                                min="0"
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-black">
                                                Discount % (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                value={discountPercentage || ''}
                                                onChange={(e) =>
                                                    setDiscountPercentage(e.target.value ? Number(e.target.value) : undefined)
                                                }
                                                min="0"
                                                max="100"
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-black">
                                                Price/Month (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                value={pricePerMonth || ''}
                                                onChange={(e) =>
                                                    setPricePerMonth(e.target.value ? Number(e.target.value) : undefined)
                                                }
                                                min="0"
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                            />
                                        </div>
                                    </>
                                )}

                                {error && (
                                    <div className="flex items-start space-x-3 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
                                        <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="flex items-start space-x-3 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-800">
                                        <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="font-medium">{success}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 border-t border-gray-200 pt-6">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={loading}
                                        className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 font-semibold text-black transition-all duration-200 hover:border-black hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center space-x-2">
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Saving...</span>
                                            </span>
                                        ) : (
                                            'Update Price'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PlansPage;
