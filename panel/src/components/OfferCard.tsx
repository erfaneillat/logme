import { Offer } from '../types/offer';
import { formatJalaliDate } from '../utils/date';

interface OfferCardProps {
    offer: Offer;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}

const OfferCard = ({ offer, onEdit, onToggleStatus, onDelete }: OfferCardProps) => {

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${offer.isActive ? 'border-gray-200 bg-gradient-to-br from-white to-red-50/30' : 'border-gray-300 bg-gray-50 opacity-75'
                }`}
            style={offer.isActive ? {
                borderColor: offer.display.backgroundColor + '40',
                boxShadow: `0 4px 12px ${offer.display.backgroundColor}20`
            } : {}}
        >
            {!offer.isActive && (
                <div className="absolute right-4 top-4 rounded-full bg-gray-600 px-3 py-1 text-xs font-bold text-white">
                    INACTIVE
                </div>
            )}
            {offer.isTimeLimited && offer.endDate && (
                <div className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                    ⏰ LIMITED
                </div>
            )}

            <div className="relative">
                {/* Display Preview */}
                <div
                    className="mb-4 rounded-lg p-4 shadow-inner"
                    style={{
                        backgroundColor: offer.display.backgroundColor,
                        color: offer.display.textColor
                    }}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="font-bold text-lg">{offer.display.bannerText}</div>
                            {offer.display.bannerSubtext && (
                                <div className="text-sm opacity-90 mt-1">{offer.display.bannerSubtext}</div>
                            )}
                        </div>
                        {offer.display.badgeText && (
                            <div className="ml-2 rounded px-2 py-1 text-xs font-bold bg-white/20">
                                {offer.display.badgeText}
                            </div>
                        )}
                    </div>
                </div>

                {/* Offer Details */}
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-black">{offer.name}</h3>
                    <p className="text-sm text-gray-500">Slug: {offer.slug}</p>
                </div>

                <div className="mb-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${offer.offerType === 'percentage' ? 'bg-green-100 text-green-700' :
                            offer.offerType === 'fixed_amount' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                            }`}>
                            {offer.offerType === 'percentage' && offer.discountPercentage ? `${offer.discountPercentage}% OFF` :
                                offer.offerType === 'fixed_amount' && offer.discountAmount ? `${offer.discountAmount.toLocaleString()} Toman` :
                                    offer.offerType.toUpperCase()}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium text-gray-900">
                            {offer.targetUserType === 'all' ? 'All Users' :
                                offer.targetUserType === 'new' ? 'New Users' :
                                    offer.targetUserType === 'old' ? 'Old Users' :
                                        offer.targetUserType === 'expired' ? 'Expired Subs' :
                                            'Active Subs'}
                        </span>
                    </div>

                    {offer.isTimeLimited && (offer.startDate || offer.endDate) && (
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            {offer.startDate && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Start:</span>
                                    <span>{formatJalaliDate(offer.startDate)}</span>
                                </div>
                            )}
                            {offer.endDate && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">End:</span>
                                    <span>{formatJalaliDate(offer.endDate)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                        <span className="text-gray-600">Priority:</span>
                        <span className="font-bold text-gray-900">{offer.priority}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Usage:</span>
                        <span className="font-medium text-gray-900">
                            {offer.usageCount}{offer.maxUsageLimit ? ` / ${offer.maxUsageLimit}` : ''}
                        </span>
                    </div>

                    {!offer.applyToAllPlans && offer.applicablePlans.length > 0 && (
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="text-gray-600 text-xs mb-1">Applicable Plans:</div>
                            <div className="flex flex-wrap gap-1">
                                {offer.applicablePlans.map((plan: any) => (
                                    <span key={plan._id} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                        {plan.title || plan.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {offer.applyToAllPlans && (
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded text-center font-medium">
                                Applies to All Plans
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="flex-1 rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 active:scale-95"
                    >
                        Edit
                    </button>
                    <button
                        onClick={onToggleStatus}
                        className={`rounded-xl px-4 py-3 font-semibold transition-all duration-200 active:scale-95 ${offer.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {offer.isActive ? '✓' : '✕'}
                    </button>
                    <button
                        onClick={onDelete}
                        className="rounded-xl bg-red-100 px-4 py-3 font-semibold text-red-700 transition-all duration-200 hover:bg-red-200 active:scale-95"
                    >
                        🗑
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferCard;
