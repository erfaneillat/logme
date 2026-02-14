import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { settingsService, Settings, KitchenSettings, AiChatSettings } from '../services/settings.service';
import { userService } from '../services/user.service';
import { User } from '../types/user';

const SettingsPage = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // User search state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await settingsService.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            // We just send the IDs, but keep the Objects for UI.
            // The service expects Partial<Settings>.
            // Ideally we map `allowedUserIds` to string[] if the backend expects so...
            // Wait, my backend implementation in settingsController:
            // if (updates.kitchen.allowedUserIds) settings.kitchen.allowedUserIds = updates.kitchen.allowedUserIds;
            // The mongoose model expects ObjectId array.
            // If I send objects, Mongoose might cast them if valid?
            // Actually it's safer to send just IDs.

            const payload: any = {
                kitchen: {
                    ...settings.kitchen,
                    allowedUserIds: settings.kitchen.allowedUserIds.map(u => u._id)
                },
                aiChat: settings.aiChat,
            };

            const updated = await settingsService.updateSettings(payload);
            // Updating local state with response (which should have populated users if I fixed controller correctly)
            // But wait, my controller fix isn't fully verified.
            // If the controller returns the saved doc, `allowedUserIds` will be IDs not populated docs unless I populate after save.

            // To be safe, I'll reload settings or assume success and keep current UI state.
            // Let's reload to be sure.
            await fetchSettings();
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateKitchenSetting = (key: keyof KitchenSettings, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            kitchen: {
                ...settings.kitchen,
                [key]: value
            }
        });
    };

    const updateAiChatSetting = (key: keyof AiChatSettings, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            aiChat: {
                ...settings.aiChat,
                [key]: value
            }
        });
    };

    const handleSearchUsers = async () => {
        if (!searchQuery.trim()) return;
        setSearchingUsers(true);
        try {
            const res = await userService.list({ search: searchQuery, limit: 5 });
            setSearchResults(res.data.items);
            setIsSearchOpen(true);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setSearchingUsers(false);
        }
    };

    const addUser = (user: User) => {
        if (!settings) return;
        // check if already added
        if (settings.kitchen.allowedUserIds.some((u: any) => u._id === user._id)) return;

        // Add to list
        const newAllowed = [...settings.kitchen.allowedUserIds, { _id: user._id, name: user.name, phone: user.phone }];
        updateKitchenSetting('allowedUserIds', newAllowed);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchOpen(false);
    };

    const removeUser = (userId: string) => {
        if (!settings) return;
        const newAllowed = settings.kitchen.allowedUserIds.filter((u: any) => u._id !== userId);
        updateKitchenSetting('allowedUserIds', newAllowed);
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
                </div>
            </Layout>
        );
    }

    if (!settings) return null;

    return (
        <Layout>
            <div className="mx-auto max-w-4xl px-8 py-12">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-black">Settings</h1>
                    <p className="mt-2 text-gray-600">Manage global application configuration</p>
                </header>

                <div className="space-y-6">
                    {/* Kitchen Settings Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-black">Kitchen Module</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Enable/Disable Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Enable Kitchen</h3>
                                    <p className="text-xs text-gray-500">Allow access to kitchen features globally</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.kitchen.isEnabled}
                                        onChange={(e) => updateKitchenSetting('isEnabled', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black/20"></div>
                                </label>
                            </div>

                            {settings.kitchen.isEnabled && (
                                <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Access Control</h3>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="accessMode"
                                                    value="all"
                                                    checked={settings.kitchen.accessMode === 'all'}
                                                    onChange={() => updateKitchenSetting('accessMode', 'all')}
                                                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                                                />
                                                <span className="text-sm text-gray-700">All Users</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="accessMode"
                                                    value="selected"
                                                    checked={settings.kitchen.accessMode === 'selected'}
                                                    onChange={() => updateKitchenSetting('accessMode', 'selected')}
                                                    className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                                                />
                                                <span className="text-sm text-gray-700">Selected Users Only</span>
                                            </label>
                                        </div>
                                    </div>

                                    {settings.kitchen.accessMode === 'selected' && (
                                        <div className="mt-4">
                                            <label className="mb-2 block text-xs font-semibold text-gray-700">Allowed Users</label>

                                            {/* Search Box */}
                                            <div className="relative mb-4">
                                                <div className="flex space-x-2">
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search by name, phone..."
                                                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                                                    />
                                                    <button
                                                        onClick={handleSearchUsers}
                                                        disabled={searchingUsers}
                                                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                                    >
                                                        {searchingUsers ? '...' : 'Search'}
                                                    </button>
                                                </div>

                                                {/* Search Results Dropdown */}
                                                {isSearchOpen && searchResults.length > 0 && (
                                                    <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                                                        {searchResults.map(user => (
                                                            <div
                                                                key={user._id}
                                                                onClick={() => addUser(user)}
                                                                className="cursor-pointer px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</p>
                                                                    <p className="text-xs text-gray-500">{user.phone}</p>
                                                                </div>
                                                                <span className="text-xs font-bold text-indigo-600">+ Add</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected Users List */}
                                            <div className="flex flex-wrap gap-2">
                                                {settings.kitchen.allowedUserIds.length === 0 && (
                                                    <p className="text-sm text-gray-500 italic">No users selected. No one will have access.</p>
                                                )}
                                                {settings.kitchen.allowedUserIds.map((u: any) => (
                                                    <div key={u._id} className="flex items-center space-x-2 rounded-full bg-white border border-gray-200 px-3 py-1 shadow-sm">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-800">{u.name || 'User'}</span>
                                                            <span className="text-[10px] text-gray-500">{u.phone}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeUser(u._id)}
                                                            className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Chat Provider Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-black">AI Chat Provider</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Provider Selection */}
                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-gray-900">Primary Provider</h3>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="aiProvider"
                                            value="openai"
                                            checked={settings.aiChat?.provider === 'openai'}
                                            onChange={() => updateAiChatSetting('provider', 'openai')}
                                            className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                                        />
                                        <span className="text-sm text-gray-700">OpenAI</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="aiProvider"
                                            value="deepseek"
                                            checked={settings.aiChat?.provider === 'deepseek'}
                                            onChange={() => updateAiChatSetting('provider', 'deepseek')}
                                            className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                                        />
                                        <span className="text-sm text-gray-700">DeepSeek</span>
                                    </label>
                                </div>
                            </div>

                            {/* Model Names */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">OpenAI Model</label>
                                    <input
                                        type="text"
                                        value={settings.aiChat?.openaiModel || ''}
                                        onChange={(e) => updateAiChatSetting('openaiModel', e.target.value)}
                                        placeholder="gpt-5-mini"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-700">DeepSeek Model</label>
                                    <input
                                        type="text"
                                        value={settings.aiChat?.deepseekModel || ''}
                                        onChange={(e) => updateAiChatSetting('deepseekModel', e.target.value)}
                                        placeholder="deepseek-chat"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                    />
                                </div>
                            </div>

                            {/* Fallback Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Enable Fallback</h3>
                                    <p className="text-xs text-gray-500">If primary provider fails, automatically try the other one</p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.aiChat?.enableFallback ?? true}
                                        onChange={(e) => updateAiChatSetting('enableFallback', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black/20"></div>
                                </label>
                            </div>

                            {/* Info Note */}
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                <p className="text-xs text-amber-800">
                                    <strong>Note:</strong> Make sure the corresponding API key is set in your server environment variables
                                    (<code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> or <code className="bg-amber-100 px-1 rounded">DEEPSEEK_API_KEY</code>).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Save Action */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-gray-800 hover:shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
