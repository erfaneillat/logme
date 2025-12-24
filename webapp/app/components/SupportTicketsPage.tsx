"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService, Ticket, TicketCategory, TicketPriority, TicketMessage } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../translations';

type ViewState = 'list' | 'create' | 'detail';

const SupportTicketsPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t, isRTL } = useTranslation();
    const [view, setView] = useState<ViewState>('list');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const CATEGORIES: { value: TicketCategory; label: string }[] = [
        { value: 'general', label: t('tickets.categories.general') },
        { value: 'technical', label: t('tickets.categories.technical') },
        { value: 'billing', label: t('tickets.categories.billing') },
        { value: 'feature_request', label: t('tickets.categories.feature_request') },
        { value: 'bug_report', label: t('tickets.categories.bug_report') },
        { value: 'other', label: t('tickets.categories.other') },
    ];

    const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
        { value: 'low', label: t('tickets.priorities.low'), color: 'bg-gray-100 text-gray-600' },
        { value: 'medium', label: t('tickets.priorities.medium'), color: 'bg-blue-50 text-blue-600' },
        { value: 'high', label: t('tickets.priorities.high'), color: 'bg-orange-50 text-orange-600' },
        { value: 'urgent', label: t('tickets.priorities.urgent'), color: 'bg-red-50 text-red-600' },
    ];

    // Create Form State
    const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'general' as TicketCategory, priority: 'medium' as TicketPriority });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reply Form State
    const [replyMessage, setReplyMessage] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Attachments State
    const [createAttachmentUrls, setCreateAttachmentUrls] = useState<string[]>([]);
    const [replyAttachmentUrls, setReplyAttachmentUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setIsUploading(true);
            const file = files[0];
            const url = await apiService.uploadTicketImage(file);
            if (isReply) {
                setReplyAttachmentUrls(prev => [...prev, url]);
            } else {
                setCreateAttachmentUrls(prev => [...prev, url]);
            }
        } catch (error) {
            console.error('Upload failed', error);
            showToast(t('tickets.toast.uploadError'), 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number, isReply: boolean) => {
        if (isReply) {
            setReplyAttachmentUrls(prev => prev.filter((_, i) => i !== index));
        } else {
            setCreateAttachmentUrls(prev => prev.filter((_, i) => i !== index));
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (view === 'detail' && selectedTicket) {
            scrollToBottom();
        }
    }, [view, selectedTicket?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            const data = await apiService.getMyTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.subject.trim() || !newTicket.message.trim()) return;

        try {
            setIsSubmitting(true);
            await apiService.createTicket(newTicket.subject, newTicket.message, newTicket.category, newTicket.priority, createAttachmentUrls);
            setNewTicket({ subject: '', message: '', category: 'general', priority: 'medium' });
            setCreateAttachmentUrls([]);
            await fetchTickets();
            setView('list');
        } catch (error) {
            showToast(t('tickets.toast.createError'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyMessage.trim()) return;

        try {
            setIsSendingReply(true);
            const updatedTicket = await apiService.replyToTicket(selectedTicket._id, replyMessage, replyAttachmentUrls);
            setSelectedTicket(updatedTicket);
            setReplyMessage('');
            setReplyAttachmentUrls([]);
            setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
        } catch (error) {
            showToast(t('tickets.toast.sendError'), 'error');
        } finally {
            setIsSendingReply(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return t('tickets.status.open');
            case 'in_progress': return t('tickets.status.in_progress');
            case 'resolved': return t('tickets.status.resolved');
            case 'closed': return t('tickets.status.closed');
            default: return status;
        }
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh]"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <div className="bg-white px-5 py-4 flex items-center justify-between shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => {
                        if (view === 'list') onClose();
                        else setView('list');
                    }} className="p-2 -mx-2 rounded-full hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-700 ${!isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-black text-gray-800">
                        {view === 'list' && t('tickets.title')}
                        {view === 'create' && t('tickets.createNew')}
                        {view === 'detail' && t('tickets.details')}
                    </h2>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => setView('create')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <span>{t('tickets.ticketBtn')}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 relative p-5">

                {/* LIST VIEW */}
                {view === 'list' && (
                    <div className="space-y-4 pb-20">
                        {isLoading ? (
                            <div className="flex justify-center py-10"><span className="loading loading-spinner text-blue-500"></span></div>
                        ) : tickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-4xl">🎫</div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{t('tickets.emptyTitle')}</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">{t('tickets.emptySub')}</p>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div
                                    key={ticket._id}
                                    onClick={() => { setSelectedTicket(ticket); setView('detail'); }}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="max-w-[70%] text-start">
                                            <h3 className="font-bold text-gray-800 text-base mb-1 line-clamp-1">{ticket.subject}</h3>
                                            <p className="text-xs text-gray-400 font-medium">{formatDate(ticket.createdAt)}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${ticket.status === 'open' ? 'bg-green-100 text-green-700' :
                                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {getStatusLabel(ticket.status)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                                        <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100 whitespace-nowrap">
                                            {CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
                                        </span>
                                        <span className={`text-[10px] px-2 py-1 rounded-md border border-gray-100 whitespace-nowrap ${PRIORITIES.find(p => p.value === ticket.priority)?.color
                                            }`}>
                                            {PRIORITIES.find(p => p.value === ticket.priority)?.label || ticket.priority}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* CREATE VIEW */}
                {view === 'create' && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">{t('tickets.subject')}</label>
                            <input
                                type="text"
                                value={newTicket.subject}
                                onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                                placeholder={t('tickets.subjectPlaceholder')}
                                className="w-full p-4 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">{t('tickets.category')}</label>
                                <div className="relative">
                                    <select
                                        value={newTicket.category}
                                        onChange={e => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                                        className="w-full p-4 rounded-xl bg-white border border-gray-200 appearance-none outline-none focus:border-blue-500"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">{t('tickets.priority')}</label>
                                <div className="relative">
                                    <select
                                        value={newTicket.priority}
                                        onChange={e => setNewTicket({ ...newTicket, priority: e.target.value as TicketPriority })}
                                        className="w-full p-4 rounded-xl bg-white border border-gray-200 appearance-none outline-none focus:border-blue-500"
                                    >
                                        {PRIORITIES.map(pri => (
                                            <option key={pri.value} value={pri.value}>{pri.label}</option>
                                        ))}
                                    </select>
                                    <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">{t('tickets.message')}</label>
                            <textarea
                                value={newTicket.message}
                                onChange={e => setNewTicket({ ...newTicket, message: e.target.value })}
                                placeholder={t('tickets.messagePlaceholder')}
                                rows={6}
                                className="w-full p-4 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-gray-300"
                            ></textarea>

                            {/* Create Attachments UI */}
                            {createAttachmentUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {createAttachmentUrls.map((url, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                                            <img src={url} alt="attachment" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeAttachment(idx, false)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {isUploading ? t('tickets.uploading') : t('tickets.addImage')}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateTicket}
                            disabled={isSubmitting || !newTicket.subject.trim() || !newTicket.message.trim()}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? t('tickets.submitting') : t('tickets.submit')}
                        </button>
                    </div>
                )}

                {/* DETAIL VIEW */}
                {view === 'detail' && selectedTicket && (
                    <div className="flex flex-col h-full">
                        {/* Ticket Info Card */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 shrink-0">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 text-lg mb-2 text-start">{selectedTicket.subject}</h3>
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${selectedTicket.status === 'open' ? 'bg-green-100 text-green-700' :
                                    selectedTicket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {getStatusLabel(selectedTicket.status)}
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-50 pt-3 mt-1">
                                <div className="flex items-center gap-1">
                                    <span>📅</span>
                                    <span>{formatDate(selectedTicket.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>🏷️</span>
                                    <span>{CATEGORIES.find(c => c.value === selectedTicket.category)?.label || selectedTicket.category}</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 pl-1">
                            {selectedTicket.messages.map((msg, idx) => {
                                const isUser = msg.senderRole === 'user';
                                return (
                                    <div key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl ${isUser
                                            ? 'bg-blue-50 text-gray-800 rounded-2xl' + (isRTL ? ' rounded-tr-none' : ' rounded-tl-none')
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-2xl shadow-sm' + (isRTL ? ' rounded-tl-none' : ' rounded-tr-none')
                                            }`}>
                                            <p className="text-sm leading-6 whitespace-pre-wrap text-start">{msg.message}</p>
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {msg.attachments.map((url, attIdx) => (
                                                        <a key={attIdx} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-white/20">
                                                            <img src={url} alt="attachment" className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            <div className={`text-[10px] mt-2 flex items-center gap-1 opacity-60 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <span>{isUser ? t('tickets.you') : t('tickets.support')}</span>
                                                <span>•</span>
                                                <span>{formatDate(msg.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Input */}
                        <div className="mt-auto bg-white -mx-5 -mb-5 border-t border-gray-100 z-20 sticky bottom-0">
                            {/* Reply Attachments Preview */}
                            {replyAttachmentUrls.length > 0 && (
                                <div className="px-3 pt-3 flex flex-wrap gap-2">
                                    {replyAttachmentUrls.map((url, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                                            <img src={url} alt="attachment" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeAttachment(idx, true)}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="p-3 flex gap-2 items-end">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="h-12 w-10 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors shrink-0"
                                >
                                    {isUploading ? <span className="loading loading-spinner loading-xs text-blue-500"></span> : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>

                                <textarea
                                    value={replyMessage}
                                    onChange={e => setReplyMessage(e.target.value)}
                                    placeholder={t('tickets.replyPlaceholder')}
                                    rows={1}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 max-h-32 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none text-sm"
                                    style={{ minHeight: '48px' }}
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={isSendingReply || (!replyMessage.trim() && replyAttachmentUrls.length === 0)}
                                    className="h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isSendingReply ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${!isRTL ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, view === 'detail')}
            />
        </motion.div>
    );
};

export default SupportTicketsPage;
