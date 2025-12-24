import { useState } from 'react';
import { KitchenCategory } from '../types/kitchen';

interface LanguageStats {
    totalItems: number;
    itemsWithEnglish: number;
    itemsWithFarsi: number;
    itemsWithBoth: number;
    hasEnglishData: boolean;
    hasFarsiData: boolean;
}

interface KitchenJsonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (json: string, language: 'en' | 'fa') => Promise<void>;
    category: KitchenCategory;
    languageStats?: LanguageStats;
}

const KitchenJsonModal = ({ isOpen, onClose, onSave, category, languageStats }: KitchenJsonModalProps) => {
    const [jsonInput, setJsonInput] = useState('');
    const [language, setLanguage] = useState<'en' | 'fa'>('en');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!jsonInput.trim()) return;

        try {
            // Validate JSON
            JSON.parse(jsonInput);
            setError(null);
        } catch (e) {
            setError('Invalid JSON format');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(jsonInput, language);
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to update category');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Update from JSON</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Update <strong>{category.title}</strong> content via JSON. Existing images will be preserved if image prompts match.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="flex gap-6 mb-6">
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${language === 'en' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    English (Default)
                                </button>
                                <button
                                    onClick={() => setLanguage('fa')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${language === 'fa' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                >
                                    Farsi (فارسی)
                                </button>
                            </div>

                            {/* Current Language Status */}
                            {languageStats && (
                                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Current Data Status</div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${languageStats.hasEnglishData ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                                <span className="text-sm font-medium text-gray-700">English</span>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${languageStats.hasEnglishData ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                {languageStats.itemsWithEnglish}/{languageStats.totalItems}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${languageStats.hasFarsiData ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                                <span className="text-sm font-medium text-gray-700">Farsi</span>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${languageStats.hasFarsiData ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                {languageStats.itemsWithFarsi}/{languageStats.totalItems}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                                <strong>Merging logic:</strong> Items will be matched by <code className="bg-gray-100 px-1 rounded">image_prompt</code>.
                                Only <strong>{language === 'en' ? 'English' : 'Farsi'}</strong> fields will be updated. The other language data will be <strong>preserved</strong>.
                            </p>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">JSON Data</label>
                            <p className="text-xs text-gray-400 mb-2">Paste the array of items here. Each item should have `category`, `image_prompt`, `name`, etc.</p>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="w-full h-[320px] p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
                                placeholder='[
  {
    "name": "Example Food",
    "category": "Breakfast",
    "image_prompt": "...",
    ...
  }
]'
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !jsonInput.trim()}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Updating...</span>
                            </>
                        ) : (
                            <span>Update Category ({language.toUpperCase()})</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KitchenJsonModal;
