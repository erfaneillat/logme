import { useState, useEffect } from 'react';
import { offerService } from '../services/offer.service';
import { Offer, OfferUserType, OfferType, OfferPlanPricing } from '../types/offer';
import { SubscriptionPlan } from '../types/subscriptionPlan';

interface OfferFormModalProps {
    token: string;
    isCreating: boolean;
    editingOffer: Offer | null;
    plans: SubscriptionPlan[];
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}

const OfferFormModal = ({ token, isCreating, editingOffer, plans, onClose, onSuccess, onError }: OfferFormModalProps) => {
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [bannerText, setBannerText] = useState('');
    const [bannerSubtext, setBannerSubtext] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#E53935');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [badgeText, setBadgeText] = useState('');
    const [icon, setIcon] = useState('');
    const [offerType, setOfferType] = useState<OfferType>('percentage');
    const [discountPercentage, setDiscountPercentage] = useState<number | undefined>(undefined);
    const [discountAmount, setDiscountAmount] = useState<number | undefined>(undefined);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isTimeLimited, setIsTimeLimited] = useState(false);
    const [targetUserType, setTargetUserType] = useState<OfferUserType>('all');
    const [userRegisteredWithinDays, setUserRegisteredWithinDays] = useState<number | undefined>(undefined);
    const [userRegisteredAfterDays, setUserRegisteredAfterDays] = useState<number | undefined>(undefined);
    const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | undefined>(undefined);
    const [hasExpiredSubscription, setHasExpiredSubscription] = useState<boolean | undefined>(undefined);
    const [minPurchaseAmount, setMinPurchaseAmount] = useState<number | undefined>(undefined);
    const [applicablePlans, setApplicablePlans] = useState<string[]>([]);
    const [applyToAllPlans, setApplyToAllPlans] = useState(false);
    const [planPricing, setPlanPricing] = useState<OfferPlanPricing[]>([]);
    const [cafebazaarProductKey, setCafebazaarProductKey] = useState('');
    const [priority, setPriority] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [maxUsageLimit, setMaxUsageLimit] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (editingOffer) {
            setName(editingOffer.name);
            setSlug(editingOffer.slug);
            setDescription(editingOffer.description || '');
            setBannerText(editingOffer.display.bannerText);
            setBannerSubtext(editingOffer.display.bannerSubtext || '');
            setBackgroundColor(editingOffer.display.backgroundColor || '#E53935');
            setTextColor(editingOffer.display.textColor || '#FFFFFF');
            setBadgeText(editingOffer.display.badgeText || '');
            setIcon(editingOffer.display.icon || '');
            setOfferType(editingOffer.offerType);
            setDiscountPercentage(editingOffer.discountPercentage);
            setDiscountAmount(editingOffer.discountAmount);
            setStartDate(editingOffer.startDate ? editingOffer.startDate.split('T')[0] : '');
            setEndDate(editingOffer.endDate ? editingOffer.endDate.split('T')[0] : '');
            setIsTimeLimited(editingOffer.isTimeLimited);
            setTargetUserType(editingOffer.targetUserType);
            setUserRegisteredWithinDays(editingOffer.conditions?.userRegisteredWithinDays);
            setUserRegisteredAfterDays(editingOffer.conditions?.userRegisteredAfterDays);
            setHasActiveSubscription(editingOffer.conditions?.hasActiveSubscription);
            setHasExpiredSubscription(editingOffer.conditions?.hasExpiredSubscription);
            setMinPurchaseAmount(editingOffer.conditions?.minPurchaseAmount);
            setApplicablePlans(editingOffer.applicablePlans?.map((p: any) => p._id || p) || []);
            setApplyToAllPlans(editingOffer.applyToAllPlans);
            setPlanPricing(editingOffer.planPricing || []);
            setCafebazaarProductKey(editingOffer.cafebazaarProductKey || '');
            setPriority(editingOffer.priority);
            setIsActive(editingOffer.isActive);
            setMaxUsageLimit(editingOffer.maxUsageLimit);
        }
    }, [editingOffer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setLoading(true);

        const offerData = {
            name,
            slug,
            description: description || undefined,
            display: {
                bannerText,
                bannerSubtext: bannerSubtext || undefined,
                backgroundColor,
                textColor,
                badgeText: badgeText || undefined,
                icon: icon || undefined,
            },
            offerType,
            discountPercentage: offerType === 'percentage' ? discountPercentage : undefined,
            discountAmount: offerType === 'fixed_amount' ? discountAmount : undefined,
            startDate: isTimeLimited && startDate ? startDate : undefined,
            endDate: isTimeLimited && endDate ? endDate : undefined,
            isTimeLimited,
            targetUserType,
            conditions: {
                userRegisteredWithinDays,
                userRegisteredAfterDays,
                hasActiveSubscription,
                hasExpiredSubscription,
                minPurchaseAmount,
            },
            applicablePlans: applyToAllPlans ? [] : applicablePlans,
            applyToAllPlans,
            planPricing: planPricing.length > 0 ? planPricing : undefined,
            cafebazaarProductKey: cafebazaarProductKey || undefined,
            priority,
            isActive,
            maxUsageLimit,
        };

        try {
            if (isCreating) {
                const response = await offerService.createOffer(token, offerData);
                if (response.success) {
                    setLocalSuccess('Offer created successfully!');
                    setTimeout(() => onSuccess(), 1000);
                } else {
                    setLocalError(response.message || 'Failed to create offer');
                }
            } else if (editingOffer) {
                const response = await offerService.updateOffer(token, editingOffer._id, offerData);
                if (response.success) {
                    setLocalSuccess('Offer updated successfully!');
                    setTimeout(() => onSuccess(), 1000);
                } else {
                    setLocalError(response.message || 'Failed to update offer');
                }
            }
        } catch (err) {
            setLocalError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const togglePlanSelection = (planId: string) => {
        setApplicablePlans(prev =>
            prev.includes(planId)
                ? prev.filter(id => id !== planId)
                : [...prev, planId]
        );
    };

    const updatePlanPricing = (planId: string, field: 'discountedPrice' | 'discountedPricePerMonth', value: number | undefined) => {
        setPlanPricing(prev => {
            const existing = prev.find(p => p.planId === planId);
            if (existing) {
                return prev.map(p => 
                    p.planId === planId 
                        ? { ...p, [field]: value }
                        : p
                );
            } else {
                return [...prev, { planId, [field]: value }];
            }
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl my-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCreating ? "M12 4v16m8-8H4" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-black">
                            {isCreating ? 'Create New Offer' : `Edit ${editingOffer?.name}`}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-bold text-black mb-4">📝 Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Offer Name *</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                    placeholder="e.g., Winter Sale 2024"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Slug *</label>
                                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required
                                    placeholder="winter-2024"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-semibold text-black">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                                placeholder="Internal description..."
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                            />
                        </div>
                    </div>

                    {/* Display Settings */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-bold text-black mb-4">🎨 Display Settings</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Banner Text *</label>
                                <input type="text" value={bannerText} onChange={(e) => setBannerText(e.target.value)} required
                                    placeholder="70% تخفیف ویژه"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Banner Subtext</label>
                                <input type="text" value={bannerSubtext} onChange={(e) => setBannerSubtext(e.target.value)}
                                    placeholder="For new users only"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Background Color</label>
                                <div className="flex gap-2">
                                    <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="h-12 w-16 rounded-lg border-2 border-gray-200 cursor-pointer"
                                    />
                                    <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-black text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Text Color</label>
                                <div className="flex gap-2">
                                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                                        className="h-12 w-16 rounded-lg border-2 border-gray-200 cursor-pointer"
                                    />
                                    <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                                        className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-black text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Badge Text</label>
                                <input type="text" value={badgeText} onChange={(e) => setBadgeText(e.target.value)}
                                    placeholder="LIMITED"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                />
                            </div>
                        </div>
                        {/* Live Preview */}
                        <div className="mt-4 p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                            <div className="text-xs text-gray-500 mb-2 font-semibold">Live Preview:</div>
                            <div className="rounded-lg p-4 shadow-lg" style={{ backgroundColor, color: textColor }}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-bold text-lg">{bannerText || 'Banner Text'}</div>
                                        {bannerSubtext && <div className="text-sm opacity-90 mt-1">{bannerSubtext}</div>}
                                    </div>
                                    {badgeText && (
                                        <div className="ml-2 rounded px-2 py-1 text-xs font-bold bg-white/20">
                                            {badgeText}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Offer Type & Value */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-bold text-black mb-4">💰 Offer Type & Value</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Offer Type *</label>
                                <select value={offerType} onChange={(e) => setOfferType(e.target.value as OfferType)} required
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed_amount">Fixed Amount</option>
                                    <option value="trial">Trial</option>
                                    <option value="feature">Feature</option>
                                </select>
                            </div>
                            {offerType === 'percentage' && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">Discount % *</label>
                                    <input type="number" value={discountPercentage || ''} onChange={(e) => setDiscountPercentage(e.target.value ? Number(e.target.value) : undefined)}
                                        min="0" max="100" placeholder="70"
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                </div>
                            )}
                            {offerType === 'fixed_amount' && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">Discount Amount (Toman) *</label>
                                    <input type="number" value={discountAmount || ''} onChange={(e) => setDiscountAmount(e.target.value ? Number(e.target.value) : undefined)}
                                        min="0" placeholder="50000"
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Time Settings */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-bold text-black mb-4">⏰ Time Settings</h3>
                        <div className="mb-4">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={isTimeLimited} onChange={(e) => setIsTimeLimited(e.target.checked)}
                                    className="mr-3 h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Time-Limited Offer</span>
                            </label>
                        </div>
                        {isTimeLimited && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">Start Date</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">End Date</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Targeting */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-bold text-black mb-4">🎯 User Targeting</h3>
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-semibold text-black">Target User Type *</label>
                            <select value={targetUserType} onChange={(e) => setTargetUserType(e.target.value as OfferUserType)} required
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                            >
                                <option value="all">All Users</option>
                                <option value="new">New Users</option>
                                <option value="old">Old Users</option>
                                <option value="expired">Expired Subscribers</option>
                                <option value="active_subscribers">Active Subscribers</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {targetUserType === 'new' && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">Registered Within (Days)</label>
                                    <input type="number" value={userRegisteredWithinDays || ''} onChange={(e) => setUserRegisteredWithinDays(e.target.value ? Number(e.target.value) : undefined)}
                                        min="0" placeholder="1"
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Show offer for users registered within this many days</p>
                                </div>
                            )}
                            {targetUserType === 'old' && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-black">Registered After (Days)</label>
                                    <input type="number" value={userRegisteredAfterDays || ''} onChange={(e) => setUserRegisteredAfterDays(e.target.value ? Number(e.target.value) : undefined)}
                                        min="0" placeholder="30"
                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Show offer for users registered after this many days</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Plan Assignment */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-bold text-black mb-4">📦 Plan Assignment</h3>
                        <div className="mb-4">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={applyToAllPlans} onChange={(e) => setApplyToAllPlans(e.target.checked)}
                                    className="mr-3 h-5 w-5 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Apply to All Plans</span>
                            </label>
                        </div>
                        {!applyToAllPlans && (
                            <div className="space-y-2">
                                <div className="text-sm font-semibold text-black mb-2">Select Applicable Plans:</div>
                                {plans.map(plan => (
                                    <label key={plan._id} className="flex items-center cursor-pointer p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50">
                                        <input type="checkbox" checked={applicablePlans.includes(plan._id)}
                                            onChange={() => togglePlanSelection(plan._id)}
                                            className="mr-3 h-5 w-5 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{plan.title || plan.name} ({plan.duration})</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Per-Plan Pricing Override */}
                    {(applyToAllPlans || applicablePlans.length > 0) && (
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-bold text-black mb-4">💵 Per-Plan Pricing (Optional Override)</h3>
                            <p className="text-sm text-gray-600 mb-4">Enter the exact discounted price and per-month price for each plan after applying the offer. Leave blank to auto-calculate from discount percentage/amount.</p>
                            <div className="space-y-4">
                                {(applyToAllPlans ? plans : plans.filter(p => applicablePlans.includes(p._id))).map(plan => {
                                    const pricing = planPricing.find(p => p.planId === plan._id);
                                    return (
                                        <div key={plan._id} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                                            <div className="mb-3">
                                                <div className="font-semibold text-black">{plan.title || plan.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    Original: {formatPrice(plan.price)} | Duration: {plan.duration}
                                                    {plan.pricePerMonth && ` | Per Month: ${formatPrice(plan.pricePerMonth)}`}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold text-black">Discounted Price (Toman)</label>
                                                    <input
                                                        type="number"
                                                        value={pricing?.discountedPrice || ''}
                                                        onChange={(e) => updatePlanPricing(plan._id, 'discountedPrice', e.target.value ? Number(e.target.value) : undefined)}
                                                        min="0"
                                                        placeholder="Auto-calculated"
                                                        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold text-black">Discounted Per Month (Toman)</label>
                                                    <input
                                                        type="number"
                                                        value={pricing?.discountedPricePerMonth || ''}
                                                        onChange={(e) => updatePlanPricing(plan._id, 'discountedPricePerMonth', e.target.value ? Number(e.target.value) : undefined)}
                                                        min="0"
                                                        placeholder="Auto-calculated"
                                                        className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CafeBazaar Integration */}
                    <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-lg font-bold text-black mb-4">🛍️ CafeBazaar Integration</h3>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-black">CafeBazaar Product Key</label>
                            <input
                                type="text"
                                value={cafebazaarProductKey}
                                onChange={(e) => setCafebazaarProductKey(e.target.value)}
                                placeholder="e.g., premium_offer_monthly"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                When users purchase a plan with this offer, this CafeBazaar product key will be used instead of the plan's default key.
                            </p>
                        </div>
                    </div>

                    {/* Additional Settings */}
                    <div>
                        <h3 className="text-lg font-bold text-black mb-4">⚙️ Additional Settings</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Priority</label>
                                <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} min="0"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                />
                                <p className="mt-1 text-xs text-gray-500">Higher = shown first</p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Max Usage Limit</label>
                                <input type="number" value={maxUsageLimit || ''} onChange={(e) => setMaxUsageLimit(e.target.value ? Number(e.target.value) : undefined)} min="0"
                                    placeholder="Optional"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-black transition-all duration-200 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-black">Status</label>
                                <div className="flex items-center h-12">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                                            className="mr-2 h-5 w-5 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    {localError && (
                        <div className="flex items-start space-x-3 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
                            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{localError}</span>
                        </div>
                    )}
                    {localSuccess && (
                        <div className="flex items-start space-x-3 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-800">
                            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">{localSuccess}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 border-t border-gray-200 pt-6">
                        <button type="button" onClick={onClose} disabled={loading}
                            className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 font-semibold text-black transition-all duration-200 hover:border-black hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (isCreating ? 'Creating...' : 'Updating...') : (isCreating ? 'Create Offer' : 'Update Offer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfferFormModal;
