import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { offerService } from '../services/offer.service';
import { subscriptionPlanService } from '../services/subscriptionPlan.service';
import { Offer, OfferUserType, OfferType } from '../types/offer';
import { SubscriptionPlan } from '../types/subscriptionPlan';
import Layout from '../components/Layout';
import OfferFormModal from '../components/OfferFormModal';
import OfferCard from '../components/OfferCard';

const OffersPage = () => {
    const { token } = useAuth();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        fetchOffers();
        fetchPlans();
    }, []);

    const fetchOffers = async () => {
        if (!token) return;

        setLoading(true);
        const response = await offerService.getAllOffers(token, false);
        if (response.success && response.data) {
            setOffers(response.data.offers);
        } else {
            setError(response.message || 'Failed to fetch offers');
        }
        setLoading(false);
    };

    const fetchPlans = async () => {
        if (!token) return;

        const response = await subscriptionPlanService.getAllPlans(token, false);
        if (response.success && response.data) {
            setPlans(response.data.plans);
        }
    };

    const handleOpenCreateModal = () => {
        setIsCreating(true);
        setEditingOffer(null);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleOpenEditModal = (offer: Offer) => {
        setIsCreating(false);
        setEditingOffer(offer);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOffer(null);
        setIsCreating(false);
    };

    const handleFormSubmit = async () => {
        setSuccess('Offer saved successfully!');
        await fetchOffers();
        setTimeout(() => {
            handleCloseModal();
            setSuccess('');
        }, 1500);
    };

    const handleDelete = async (id: string) => {
        if (!token) return;

        setLoading(true);
        const response = await offerService.deleteOffer(token, id);
        
        if (response.success) {
            setSuccess('Offer deleted successfully!');
            await fetchOffers();
            setDeleteConfirmId(null);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(response.message || 'Failed to delete offer');
        }
        setLoading(false);
    };

    const handleToggleStatus = async (id: string) => {
        if (!token) return;

        setLoading(true);
        const response = await offerService.toggleOfferStatus(token, id);
        
        if (response.success) {
            setSuccess('Offer status updated!');
            await fetchOffers();
            setTimeout(() => setSuccess(''), 2000);
        } else {
            setError(response.message || 'Failed to toggle offer status');
        }
        setLoading(false);
    };

    const sortedOffers = [...offers].sort((a, b) => b.priority - a.priority);

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="mb-6 flex items-center space-x-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/30">
                            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold tracking-tight text-black">Offers & Promotions</h1>
                            <p className="mt-1 text-base text-gray-600">Create and manage promotional offers for your plans</p>
                        </div>
                        <button
                            onClick={handleOpenCreateModal}
                            className="rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30 active:scale-95"
                        >
                            + Create New Offer
                        </button>
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

                {/* Offers Grid */}
                {loading && offers.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-4 text-sm font-medium text-gray-600">Loading offers...</p>
                        </div>
                    </div>
                ) : offers.length === 0 ? (
                    <div className="text-center py-20">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No offers yet</h3>
                        <p className="mt-2 text-sm text-gray-600">Get started by creating a new promotional offer.</p>
                        <button
                            onClick={handleOpenCreateModal}
                            className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white transition-all hover:bg-gray-900"
                        >
                            Create First Offer
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sortedOffers.map((offer) => (
                            <OfferCard
                                key={offer._id}
                                offer={offer}
                                onEdit={() => handleOpenEditModal(offer)}
                                onToggleStatus={() => handleToggleStatus(offer._id)}
                                onDelete={() => setDeleteConfirmId(offer._id)}
                            />
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
                                <h3 className="text-2xl font-bold text-black">Delete Offer?</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    This action cannot be undone. The offer will be permanently deleted.
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
                    <OfferFormModal
                        token={token!}
                        isCreating={isCreating}
                        editingOffer={editingOffer}
                        plans={plans}
                        onClose={handleCloseModal}
                        onSuccess={handleFormSubmit}
                        onError={setError}
                    />
                )}
            </div>
        </Layout>
    );
};

export default OffersPage;
