"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { apiService, BASE_URL } from '../services/apiService';
import ReactMarkdown from 'react-markdown';

interface ChatPageProps {
    onBack: () => void;
    onSubscriptionClick?: () => void;
}

const SUGGESTIONS = [
    "چند تا گزینه غذایی بده",
    "امروز چی بخورم بهتره؟",
    "یه غذای سالم",
    "یه پلن هفتگی سبک و سالم بده",
    "بر اساس هدف کالری روزانه برام"
];

const WELCOME_MESSAGE = 'سلام! 👋 من درسا هستم، مربی تغذیه شما. هر سوالی درباره رژیم غذایی، تغذیه یا کالری‌هاتون دارید، بپرسید. من اینجام که کمکتون کنم! 🥗';

const ChatPage: React.FC<ChatPageProps> = ({ onBack, onSubscriptionClick }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [attachedImage, setAttachedImage] = useState<File | null>(null);
    const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
    const [streamingText, setStreamingText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);
    const isFirstLoadRef = useRef(true);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        bottomRef.current?.scrollIntoView({ behavior });
    }, []);

    // Load initial chat history
    useEffect(() => {
        const loadHistory = async () => {
            setIsHistoryLoading(true);
            try {
                const history = await apiService.getNutritionChatHistory(undefined, 30);

                if (history.items.length === 0) {
                    // Show welcome message if no history
                    setMessages([{
                        id: 'welcome',
                        text: WELCOME_MESSAGE,
                        isUser: false,
                        timestamp: new Date(),
                    }]);
                } else {
                    // Convert API response to ChatMessage format
                    const chatMessages: ChatMessage[] = history.items.map(item => ({
                        id: item._id,
                        text: item.message,
                        isUser: item.senderRole === 'user',
                        timestamp: new Date(item.createdAt),
                        imageUrl: item.imageUrl,
                    }));
                    setMessages(chatMessages);
                    setHasMore(history.hasMore);
                    setNextCursor(history.nextCursor);
                }
            } catch (err) {
                console.error('Failed to load chat history:', err);
                // Show welcome message on error
                setMessages([{
                    id: 'welcome',
                    text: WELCOME_MESSAGE,
                    isUser: false,
                    timestamp: new Date(),
                }]);
            } finally {
                setIsHistoryLoading(false);
            }
        };

        loadHistory();
    }, []);

    // Scroll to bottom when messages change (if new message) or when typing
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        const lastMsgId = lastMsg?.id;
        const prevLastId = lastMessageIdRef.current;

        // Update ref
        lastMessageIdRef.current = lastMsgId || null;

        // If typing or streaming, scroll to bottom
        if (isTyping || streamingText) {
            scrollToBottom();
            return;
        }

        // Check if it's a new message (not history)
        if (messages.length > 0) {
            if (lastMsgId !== prevLastId) {
                const behavior = isFirstLoadRef.current ? 'auto' : 'smooth';
                scrollToBottom(behavior);
                if (isFirstLoadRef.current) isFirstLoadRef.current = false;
            }
        }
    }, [messages, isTyping, streamingText, scrollToBottom]);



    // Handle scroll to load more history
    const handleScroll = useCallback(async () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // Load more when scrolled near the top
        if (container.scrollTop < 100 && hasMore && !isHistoryLoading) {
            setIsHistoryLoading(true);
            try {
                const history = await apiService.getNutritionChatHistory(nextCursor || undefined, 30);

                const olderMessages: ChatMessage[] = history.items.map(item => ({
                    id: item._id,
                    text: item.message,
                    isUser: item.senderRole === 'user',
                    timestamp: new Date(item.createdAt),
                    imageUrl: item.imageUrl,
                }));

                if (olderMessages.length > 0) {
                    setMessages(prev => [...olderMessages, ...prev]);
                    setHasMore(history.hasMore);
                    setNextCursor(history.nextCursor);
                }
            } catch (err) {
                console.error('Failed to load more history:', err);
            } finally {
                setIsHistoryLoading(false);
            }
        }
    }, [hasMore, isHistoryLoading, nextCursor]);

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachedImage = () => {
        setAttachedImage(null);
        setAttachedImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async (text: string = inputText) => {
        if (!text.trim() && !attachedImage) return;

        const trimmedText = text.trim() || 'تصویر ارسال شد';
        let imageUrl: string | undefined;

        // Create user message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: trimmedText,
            isUser: true,
            timestamp: new Date(),
            imageUrl: attachedImagePreview || undefined,
            isSending: true,
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);
        setStreamingText('');
        setError(null);

        // Upload image if attached
        if (attachedImage) {
            try {
                imageUrl = await apiService.uploadChatImage(attachedImage);
            } catch (err) {
                console.error('Failed to upload image:', err);
                // Continue without image
            }
        }

        removeAttachedImage();

        try {
            // Use streaming API
            await apiService.streamChatMessage(
                trimmedText,
                imageUrl,
                // onToken
                (token) => {
                    setStreamingText(prev => prev + token);
                },
                // onComplete
                (fullText) => {
                    const aiMsg: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        text: fullText,
                        isUser: false,
                        timestamp: new Date(),
                    };
                    setMessages(prev => {
                        // Remove isSending flag from user message
                        const updated = prev.map(m =>
                            m.id === userMsg.id ? { ...m, isSending: false } : m
                        );
                        return [...updated, aiMsg];
                    });
                    setStreamingText('');
                    setIsTyping(false);
                },
                // onError
                (err) => {
                    console.error('Stream error:', err);
                    if (err === 'DAILY_MESSAGE_LIMIT_REACHED') {
                        setError('محدودیت روزانه پیام به پایان رسید. برای ادامه اشتراک تهیه کنید.');
                        // Remove the user message
                        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
                    } else {
                        setError('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
                    }
                    setIsTyping(false);
                    setStreamingText('');
                }
            );
        } catch (e) {
            console.error('Chat error:', e);
            setError('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
            setIsTyping(false);
            setStreamingText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatDate = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
        };
        return date.toLocaleDateString('fa-IR', options);
    };

    const shouldShowDateDivider = (currentMsg: ChatMessage, prevMsg: ChatMessage | null): boolean => {
        if (!prevMsg) return true;
        const currentDate = new Date(currentMsg.timestamp).toDateString();
        const prevDate = new Date(prevMsg.timestamp).toDateString();
        return currentDate !== prevDate;
    };

    // Get full image URL
    const getImageUrl = (url?: string): string | undefined => {
        if (!url) return undefined;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `${BASE_URL}${url}`;
    };

    return (
        <div className="flex flex-col h-screen bg-[#F8F9FB] fixed inset-0 z-50 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <button
                    onClick={onBack}
                    className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>

                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="Dorsa" className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-gray-900 leading-tight">درسا</h1>
                        <p className="text-[10px] text-gray-400 font-medium">مربی تغذیه و رژیم شما</p>
                    </div>
                </div>
                <button className="p-2 -ml-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-b border-red-100 px-4 py-3 text-center transition-all animate-fade-in">
                    <p className="text-red-600 text-sm font-medium mb-1">{error}</p>
                    <div className="flex justify-center gap-4 mt-1">
                        {error.includes('اشتراک') && onSubscriptionClick && (
                            <button
                                onClick={onSubscriptionClick}
                                className="text-red-700 text-xs font-bold underline bg-red-100/50 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
                            >
                                خرید اشتراک
                            </button>
                        )}
                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 text-xs underline px-2 py-1 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        >
                            بستن
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-6 space-y-reverse no-scrollbar flex flex-col-reverse"
            >
                <div ref={bottomRef} className="h-px w-full" />

                {/* Streaming response - Visual Bottom (DOM First) */}
                {isTyping && streamingText && (
                    <div className="flex justify-end w-full animate-fade-in mb-6">
                        <div className="flex flex-col items-end max-w-[85%]">
                            <div className="bg-white border border-gray-100 rounded-[24px] rounded-bl-md px-5 py-3.5 shadow-sm">
                                <div className="text-sm text-gray-800 markdown-content">
                                    <ReactMarkdown
                                        components={{
                                            p: (props) => <p className="mb-1 last:mb-0 leading-relaxed" {...props} />,
                                            strong: (props) => <span className="font-bold" {...props} />,
                                            ul: (props) => <ul className="list-disc list-inside mb-2" {...props} />,
                                            ol: (props) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                            li: (props) => <li className="mb-0.5" {...props} />,
                                        }}
                                    >
                                        {streamingText}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm mr-2 flex-shrink-0 self-end mb-1">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="AI" className="w-full h-full object-cover" />
                        </div>
                    </div>
                )}

                {/* Typing indicator - Visual Bottom (DOM First) */}
                {isTyping && !streamingText && (
                    <div className="flex justify-end w-full animate-fade-in mb-6">
                        <div className="flex flex-col items-end">
                            <div className="bg-white border border-gray-100 rounded-[24px] rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex gap-1 items-center h-5">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm mr-2 flex-shrink-0 mt-1 self-end">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="AI" className="w-full h-full object-cover" />
                        </div>
                    </div>
                )}

                {/* Messages - Reversed Order */}
                {[...messages].reverse().map((msg, index) => {
                    const originalIndex = messages.length - 1 - index;
                    const prevMsg = originalIndex > 0 ? messages[originalIndex - 1] : null;

                    return (
                        <React.Fragment key={msg.id}>
                            <div className={`flex w-full animate-slide-up ${msg.isUser ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] flex flex-col ${msg.isUser ? 'items-start' : 'items-end'}`}>
                                    {/* Image attachment */}
                                    {msg.imageUrl && (
                                        <div className={`mb-2 overflow-hidden rounded-xl ${msg.isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                                            <img
                                                src={getImageUrl(msg.imageUrl)}
                                                alt="Attached"
                                                className="max-w-[200px] max-h-[200px] object-cover"
                                            />
                                        </div>
                                    )}


                                    <div
                                        className={`px-5 py-3.5 text-sm shadow-sm relative group transition-all duration-300 ${msg.isUser
                                            ? 'bg-gray-900 text-white rounded-[24px] rounded-br-md hover:shadow-md'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-[24px] rounded-bl-md hover:shadow-md'
                                            }`}
                                    >
                                        <div className={`markdown-content ${msg.isUser ? 'text-white' : 'text-gray-800'}`}>
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }: any) => <p className="mb-1 last:mb-0 leading-relaxed" {...props} />,
                                                    strong: ({ node, ...props }: any) => <span className="font-bold" {...props} />,
                                                    ul: ({ node, ...props }: any) => <ul className="list-disc list-inside mb-2" {...props} />,
                                                    ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                                    li: ({ node, ...props }: any) => <li className="mb-0.5" {...props} />,
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium">
                                        {msg.timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {!msg.isUser && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm mr-2 flex-shrink-0 self-end mb-1">
                                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="AI" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            {shouldShowDateDivider(msg, prevMsg) && (
                                <div className="flex justify-center mb-6 mt-6">
                                    <span className="bg-gray-200/50 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full">
                                        {formatDate(msg.timestamp)}
                                    </span>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* History Loading Indicator - Visual Top (DOM Last) */}
                {isHistoryLoading && messages.length > 0 && (
                    <div className="flex justify-center py-2 mb-4">
                        <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-gray-500">در حال بارگذاری...</span>
                        </div>
                    </div>
                )}

                {/* Initial Loading */}
                {isHistoryLoading && messages.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
                            <span className="text-gray-500 text-sm">در حال بارگذاری گفتگو...</span>
                        </div>
                    </div>
                )}

                <div className="h-4" /> {/* Spacer at top */}
            </div>

            {/* Footer Area */}
            <div className="bg-white border-t border-gray-100 pt-3 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                {/* Chips */}
                <div className="flex overflow-x-auto px-4 pb-3 space-x-2 space-x-reverse no-scrollbar mb-1">
                    {SUGGESTIONS.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSend(suggestion)}
                            disabled={isTyping}
                            className={`flex-shrink-0 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2.5 rounded-[16px] transition-all duration-200 active:scale-95 ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                {/* Attached Image Preview */}
                {attachedImagePreview && (
                    <div className="px-4 pb-2">
                        <div className="relative inline-block">
                            <img
                                src={attachedImagePreview}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                            />
                            <button
                                onClick={removeAttachedImage}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Bar */}
                <div className="px-4 flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-[24px] px-2 py-1.5 flex items-center focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-300 transition-all">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="پیام خود را بنویسید..."
                            disabled={isTyping}
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 text-right px-2 disabled:opacity-50"
                        />
                    </div>

                    <button
                        onClick={() => handleSend()}
                        disabled={(!inputText.trim() && !attachedImage) || isTyping}
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform ${(inputText.trim() || attachedImage) && !isTyping
                            ? 'bg-gray-900 text-white hover:scale-105 active:scale-95 rotate-0'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed -rotate-90'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ChatPage;
