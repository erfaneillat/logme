"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { chatWithNutritionist } from '../services/geminiService';

interface ChatPageProps {
    onBack: () => void;
}

const SUGGESTIONS = [
    "چند تا گزینه غذایی بده",
    "امروز چی بخورم بهتره؟",
    "یه غذای سالم",
    "یه پلن هفتگی سبک و سالم بده",
    "بر اساس هدف کالری روزانه برام"
];

const ChatPage: React.FC<ChatPageProps> = ({ onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            text: 'امروز چی بخورم بهتره؟',
            isUser: true,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5)
        },
        {
            id: '2',
            text: 'برای ناهار/شام: 150 گرم سینه مرغ گریل + نیم فنجان برنج قهوه‌ای و سالاد - حدود 450 کالری و 40-45 گرم پروتئین.\nتا هدف امروز حدود 1210 کالری و 65 گرم پروتئین باقیه؛ یک میان‌وعده پروتئینی (ماست کم‌چرب یا شیک پروتئین) هم اضافه کن.',
            isUser: false,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1000 * 30)
        },
        {
            id: '3',
            text: 'چه مکمل هایی استفاده کنم؟',
            isUser: true,
            timestamp: new Date(Date.now() - 1000 * 60 * 15)
        },
        {
            id: '4',
            text: 'برای هدف کاهش وزن و رسیدن به 105 گرم پروتئین روزانه، این مکمل‌ها معمولاً مفیدند:\n• پروتئین وی (شیک) – برای تکمیل پروتئین روزانه.\n• ویتامین D – اگر آفتاب‌گیری کم یا کمبود دارید.\n• اُمگا-۳ (روغن ماهی) – برای سلامت قلب و کاهش التهاب.',
            isUser: false,
            timestamp: new Date(Date.now() - 1000 * 60 * 14)
        }
    ]);

    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (text: string = inputText) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: text,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Prepare history for API
        const history = messages.map(m => ({
            role: m.isUser ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        try {
            const responseText = await chatWithNutritionist(text, history);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
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

                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="Dorsa" className="w-full h-full object-cover" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <h1 className="text-sm font-black text-gray-900 mt-1">درسا</h1>
                    <p className="text-[10px] text-gray-400 font-bold">مربی تغذیه و رژیم شما</p>
                </div>

                <button className="p-2 -ml-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar pb-32">
                <div className="flex justify-center mb-6">
                    <span className="bg-gray-200/50 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full">۱۵ آذر</span>
                </div>

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex w-full animate-slide-up ${msg.isUser ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className={`max-w-[85%] flex flex-col ${msg.isUser ? 'items-start' : 'items-end'}`}>
                            <div
                                className={`px-5 py-3.5 text-sm leading-relaxed shadow-sm relative group transition-all duration-300 ${msg.isUser
                                        ? 'bg-gray-900 text-white rounded-[24px] rounded-br-md hover:shadow-md'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-[24px] rounded-bl-md hover:shadow-md'
                                    }`}
                            >
                                <p className="whitespace-pre-line">{msg.text}</p>
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
                ))}

                {isTyping && (
                    <div className="flex justify-end w-full animate-fade-in">
                        <div className="flex flex-col items-end">
                            <div className="bg-white border border-gray-100 rounded-[24px] rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex space-x-1 space-x-reverse items-center h-5">
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
                <div ref={messagesEndRef} />
            </div>

            {/* Footer Area */}
            <div className="bg-white border-t border-gray-100 pt-3 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                {/* Chips */}
                <div className="flex overflow-x-auto px-4 pb-3 space-x-2 space-x-reverse no-scrollbar mb-1">
                    {SUGGESTIONS.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSend(suggestion)}
                            className="flex-shrink-0 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2.5 rounded-[16px] transition-all duration-200 active:scale-95"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>

                {/* Input Bar */}
                <div className="px-4 flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-[24px] px-2 py-1.5 flex items-center focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-300 transition-all">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors">
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
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-right px-2"
                        />
                    </div>

                    <button
                        onClick={() => handleSend()}
                        disabled={!inputText.trim() && !isTyping}
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform ${inputText.trim()
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
