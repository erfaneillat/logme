import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlanService } from '../services/subscriptionPlan.service';
import { SubscriptionPlan } from '../types/subscriptionPlan';
import { API_BASE_URL } from '../config/api';
import Layout from '../components/Layout';

const PlansPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [duration, setDuration] = useState<'monthly' | '3month' | 'yearly'>('monthly');
    const [price, setPrice] = useState<number>(0);
    const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
    const [discountPercentage, setDiscountPercentage] = useState<number | undefined>(undefined);
    const [pricePerMonth, setPricePerMonth] = useState<number | undefined>(undefined);
    const [cafebazaarProductKey, setCafebazaarProductKey] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [sortOrder, setSortOrder] = useState<number>(0);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleOpenCreateModal = () => {
        setIsCreating(true);
        setEditingPlan(null);
        setName('');
        setTitle('');
        setDuration('monthly');
        setPrice(0);
        setOriginalPrice(undefined);
        setDiscountPercentage(undefined);
        setPricePerMonth(undefined);
        setCafebazaarProductKey('');
        setIsActive(true);
        setSortOrder(0);
        setSelectedImage(null);
        setImagePreview(null);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleOpenEditModal = (plan: SubscriptionPlan) => {
        setIsCreating(false);
        setEditingPlan(plan);
        setName(plan.name);
        setTitle(plan.title || '');
        setDuration(plan.duration as 'monthly' | 'yearly');
        setPrice(plan.price);
        setOriginalPrice(plan.originalPrice);
        setDiscountPercentage(plan.discountPercentage);
        setPricePerMonth(plan.pricePerMonth);
        setCafebazaarProductKey(plan.cafebazaarProductKey || '');
        setIsActive(plan.isActive);
        setSortOrder(plan.sortOrder);
        setSelectedImage(null);
        setImagePreview(plan.imageUrl ? `${API_BASE_URL}${plan.imageUrl}` : null);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlan(null);
        setIsCreating(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async (planId: string) => {
        if (!token || !selectedImage) return;

        setUploadingImage(true);
        setError('');
        const response = await subscriptionPlanService.uploadPlanImage(token, planId, selectedImage);

        if (response.success) {
            setSuccess('Image uploaded successfully!');
            await fetchPlans();
            setSelectedImage(null);
            setTimeout(() => setSuccess(''), 2000);
        } else {
            setError(response.message || 'Failed to upload image');
        }
        setUploadingImage(false);
    };

    const handleDeleteImage = async (planId: string) => {
        if (!token) return;

        setUploadingImage(true);
        setError('');
        const response = await subscriptionPlanService.deletePlanImage(token, planId);

        if (response.success) {
            setSuccess('Image deleted successfully!');
            await fetchPlans();
            setImagePreview(null);
            setTimeout(() => setSuccess(''), 2000);
        } else {
            setError(response.message || 'Failed to delete image');
        }
        setUploadingImage(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isCreating) {
                const response = await subscriptionPlanService.createPlan(token, {
                    name,
                    title: title || undefined,
                    duration,
                    price,
                    originalPrice: originalPrice || undefined,
                    discountPercentage: discountPercentage || undefined,
                    pricePerMonth: pricePerMonth || undefined,
                    cafebazaarProductKey: cafebazaarProductKey || undefined,
                    isActive,
                    sortOrder,
                });

                if (response.success) {
                    // Upload image if selected
                    if (selectedImage && response.data?.plan._id) {
                        await handleUploadImage(response.data.plan._id);
                    }
                    setSuccess('Plan created successfully!');
                    await fetchPlans();
                    setTimeout(() => {
                        handleCloseModal();
                        setSuccess('');
                    }, 1500);
                } else {
                    setError(response.message || 'Failed to create plan');
                }
            } else if (editingPlan) {
                // Build update payload, explicitly setting null to clear fields
                const updatePayload: any = {
                    name,
                    title: title || undefined,
                    duration,
                    price,
                    cafebazaarProductKey: cafebazaarProductKey || undefined,
                    isActive,
                    sortOrder,
                };

                // Explicitly handle optional numeric fields - send null to clear them
                if (originalPrice !== undefined && originalPrice !== 0) {
                    updatePayload.originalPrice = originalPrice;
                } else if (editingPlan.originalPrice !== undefined) {
                    updatePayload.originalPrice = null;
                }

                if (discountPercentage !== undefined && discountPercentage !== 0) {
                    updatePayload.discountPercentage = discountPercentage;
                } else if (editingPlan.discountPercentage !== undefined) {
                    updatePayload.discountPercentage = null;
                }

                if (pricePerMonth !== undefined && pricePerMonth !== 0) {
                    updatePayload.pricePerMonth = pricePerMonth;
                } else if (editingPlan.pricePerMonth !== undefined) {
                    updatePayload.pricePerMonth = null;
                }

                const response = await subscriptionPlanService.updatePlan(token, editingPlan._id, updatePayload);

                if (response.success) {
                    // Upload image if selected
                    if (selectedImage) {
                        await handleUploadImage(editingPlan._id);
                    }
                    setSuccess('Plan updated successfully!');
                    await fetchPlans();
                    setTimeout(() => {
                        handleCloseModal();
                        setSuccess('');
                    }, 1500);
                } else {
                    setError(response.message || 'Failed to update plan');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!token) return;

        setLoading(true);
        const response = await subscriptionPlanService.deletePlan(token, id);
        
        if (response.success) {
            setSuccess('Plan deleted successfully!');
            await fetchPlans();
            setDeleteConfirmId(null);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(response.message || 'Failed to delete plan');
        }
        setLoading(false);
    };

    const handleToggleStatus = async (id: string) => {
        if (!token) return;

        setLoading(true);
        const response = await subscriptionPlanService.togglePlanStatus(token, id);
        
        if (response.success) {
            setSuccess('Plan status updated!');
            await fetchPlans();
            setTimeout(() => setSuccess(''), 2000);
        } else {
            setError(response.message || 'Failed to toggle plan status');
        }
        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    // Sort plans by sortOrder
    const sortedPlans = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);

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
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold tracking-tight text-black">Subscription Plans</h1>
                            <p className="mt-1 text-base text-gray-600">Manage all subscription plans and pricing</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/offers')}
                                className="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:shadow-red-500/40 active:scale-95"
                            >
                                🎁 Manage Offers
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className="rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30 active:scale-95"
                            >
                                + Create New Plan
                            </button>
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
                ) : plans.length === 0 ? (
                    <div className="text-center py-20">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No plans yet</h3>
                        <p className="mt-2 text-sm text-gray-600">Get started by creating a new subscription plan.</p>
                        <button
                            onClick={handleOpenCreateModal}
                            className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white transition-all hover:bg-gray-900"
                        >
                            Create First Plan
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sortedPlans.map((plan) => (
                            <div key={plan._id} className={`group relative overflow-hidden rounded-2xl border p-8 shadow-sm transition-all duration-300 hover:shadow-xl ${plan.isActive ? 'border-gray-200 bg-gradient-to-br from-white to-purple-50/30' : 'border-gray-300 bg-gray-50 opacity-75'}`}>
                                {!plan.isActive && (
                                    <div className="absolute right-4 top-4 rounded-full bg-gray-600 px-3 py-1 text-xs font-bold text-white">
                                        INACTIVE
                                    </div>
                                )}

                                <div className="relative">
                                    {/* Plan Image */}
                                    {plan.imageUrl && (
                                        <div className="mb-6 overflow-hidden rounded-xl">
                                            <img
                                                src={`${API_BASE_URL}${plan.imageUrl}`}
                                                alt={plan.title || plan.name}
                                                className="h-40 w-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="mb-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-black">{plan.title || plan.name}</h3>
                                            {plan.title && <p className="text-sm text-gray-500">{plan.name}</p>}
                                        </div>
                                        <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                                            plan.duration === 'yearly' ? 'bg-purple-100 text-purple-700' : 
                                            plan.duration === '3month' ? 'bg-green-100 text-green-700' : 
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {plan.duration === '3month' ? '3 MONTHS' : plan.duration.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="mb-8 space-y-3">
                                        <div className="text-4xl font-bold text-black">{formatPrice(plan.price)}</div>
                                        {plan.originalPrice && (
                                            <div className="text-base text-gray-500 line-through">
                                                {formatPrice(plan.originalPrice)}
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-3">
                                            {plan.discountPercentage && (
                                                <div className="inline-flex items-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-red-500/30">
                                                    {plan.discountPercentage}% OFF
                                                </div>
                                            )}
                                            {plan.pricePerMonth && (
                                                <div className="text-sm font-medium text-gray-600">
                                                    {formatPrice(plan.pricePerMonth)}/month
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenEditModal(plan)}
                                            className="flex-1 rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 active:scale-95"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(plan._id)}
                                            className={`rounded-xl px-4 py-3 font-semibold transition-all duration-200 active:scale-95 ${
                                                plan.isActive
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {plan.isActive ? '✓' : '✕'}
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(plan._id)}
                                            className="rounded-xl bg-red-100 px-4 py-3 font-semibold text-red-700 transition-all duration-200 hover:bg-red-200 active:scale-95"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-black">Delete Plan?</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    This action cannot be undone. The plan will be permanently deleted.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    disabled={loading}
                                    className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 font-semibold text-black transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    disabled={loading}
                                    className="flex-1 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-black to-gray-800 shadow-lg">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCreating ? "M12 4v16m8-8H4" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-black">
                                        {isCreating ? 'Create New Plan' : `Edit ${editingPlan?.name}`}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-black">
                                            Plan Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="e.g., Monthly Plan"
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-black">
                                            Duration *
                                        </label>
                                        <select
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value as 'monthly' | '3month' | 'yearly')}
                                            required
                                            disabled={!isCreating}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10 disabled:bg-gray-100"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="3month">3 Months</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">
                                        Display Title (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Premium, Pro, Basic"
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-black">Price (Toman) *</label>
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
                                            Original Price (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            value={originalPrice || ''}
                                            onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                                            min="0"
                                            placeholder="For showing discounts"
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-black">
                                            Discount % (Optional)
                                        </label>
                                        <input
                                            type="number"
                                            value={discountPercentage || ''}
                                            onChange={(e) => setDiscountPercentage(e.target.value ? Number(e.target.value) : undefined)}
                                            min="0"
                                            max="100"
                                            placeholder="e.g., 70"
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
                                            onChange={(e) => setPricePerMonth(e.target.value ? Number(e.target.value) : undefined)}
                                            min="0"
                                            placeholder="e.g., 58333 (manually enter)"
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Enter the monthly equivalent price to display (not auto-calculated)
                                        </p>
                                    </div>
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

                                {/* Image Upload Section */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">
                                        Plan Image (Optional)
                                    </label>
                                    <div className="space-y-3">
                                        {imagePreview && (
                                            <div className="relative inline-block">
                                                <img
                                                    src={imagePreview}
                                                    alt="Plan preview"
                                                    className="h-32 w-full max-w-md rounded-xl object-cover border-2 border-gray-200"
                                                />
                                                {editingPlan && !selectedImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage(editingPlan._id)}
                                                        disabled={uploadingImage}
                                                        className="absolute top-2 right-2 rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white shadow-lg hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="rounded-xl border-2 border-dashed border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-black hover:bg-gray-50"
                                        >
                                            {imagePreview ? '📷 Change Image' : '📷 Upload Image'}
                                        </button>
                                        <p className="text-xs text-gray-500">Max size: 5MB. Formats: JPG, PNG, GIF, WebP</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-black">
                                            Sort Order
                                        </label>
                                        <input
                                            type="number"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(Number(e.target.value))}
                                            min="0"
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-black">
                                            Status
                                        </label>
                                        <div className="flex items-center h-12">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isActive}
                                                    onChange={(e) => setIsActive(e.target.checked)}
                                                    className="mr-2 h-5 w-5 rounded border-gray-300"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Active</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

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
                                        ) : isCreating ? (
                                            'Create Plan'
                                        ) : (
                                            'Update Plan'
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
