import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appVersionService } from '../services/appVersion.service';
import { AppVersion, Platform } from '../types/appVersion';
import Layout from '../components/Layout';
import VersionCard from '../components/VersionCard';

const AppVersionsPage = () => {
    const { token } = useAuth();
    const [versions, setVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Form state
    const [platform, setPlatform] = useState<Platform>('android');
    const [version, setVersion] = useState('');
    const [buildNumber, setBuildNumber] = useState('');
    const [minVersion, setMinVersion] = useState('');
    const [minBuildNumber, setMinBuildNumber] = useState('');
    const [isForceUpdate, setIsForceUpdate] = useState(false);
    const [isOptionalUpdate, setIsOptionalUpdate] = useState(false);
    const [updateTitle, setUpdateTitle] = useState('');
    const [updateMessage, setUpdateMessage] = useState('');
    const [storeUrl, setStoreUrl] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        fetchVersions();
    }, []);

    const fetchVersions = async () => {
        if (!token) return;
        setLoading(true);
        const response = await appVersionService.getAllAppVersions(token);
        if (response.success && response.data) {
            setVersions(response.data);
        } else {
            setError(response.message || 'Failed to fetch app versions');
        }
        setLoading(false);
    };

    const resetForm = () => {
        setPlatform('android');
        setVersion('');
        setBuildNumber('');
        setMinVersion('');
        setMinBuildNumber('');
        setIsForceUpdate(false);
        setIsOptionalUpdate(false);
        setUpdateTitle('');
        setUpdateMessage('');
        setStoreUrl('');
        setIsActive(true);
    };

    const loadVersionToForm = (ver: AppVersion) => {
        setPlatform(ver.platform);
        setVersion(ver.version);
        setBuildNumber(ver.buildNumber.toString());
        setMinVersion(ver.minVersion);
        setMinBuildNumber(ver.minBuildNumber.toString());
        setIsForceUpdate(ver.isForceUpdate);
        setIsOptionalUpdate(ver.isOptionalUpdate);
        setUpdateTitle(ver.updateTitle || '');
        setUpdateMessage(ver.updateMessage || '');
        setStoreUrl(ver.storeUrl || '');
        setIsActive(ver.isActive);
    };

    const handleOpenCreateModal = () => {
        setIsCreating(true);
        setEditingVersion(null);
        resetForm();
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleOpenEditModal = (ver: AppVersion) => {
        setIsCreating(false);
        setEditingVersion(ver);
        loadVersionToForm(ver);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingVersion(null);
        setIsCreating(false);
        resetForm();
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setError('');

        const versionData = {
            platform,
            version,
            buildNumber: parseInt(buildNumber),
            minVersion,
            minBuildNumber: parseInt(minBuildNumber),
            isForceUpdate,
            isOptionalUpdate,
            updateTitle: updateTitle || undefined,
            updateMessage: updateMessage || undefined,
            storeUrl: storeUrl || undefined,
            isActive,
        };

        let response;
        if (isCreating) {
            response = await appVersionService.createAppVersion(token, versionData);
        } else if (editingVersion) {
            response = await appVersionService.updateAppVersion(token, editingVersion._id, versionData);
        }

        if (response?.success) {
            setSuccess(`App version ${isCreating ? 'created' : 'updated'} successfully!`);
            await fetchVersions();
            setTimeout(() => {
                handleCloseModal();
                setSuccess('');
            }, 1500);
        } else {
            setError(response?.message || `Failed to ${isCreating ? 'create' : 'update'} app version`);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!token) return;
        setLoading(true);
        const response = await appVersionService.deleteAppVersion(token, id);
        
        if (response.success) {
            setSuccess('App version deleted successfully!');
            await fetchVersions();
            setDeleteConfirmId(null);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(response.message || 'Failed to delete app version');
        }
        setLoading(false);
    };

    const handleToggleActive = async (id: string) => {
        if (!token) return;
        setLoading(true);
        const response = await appVersionService.toggleAppVersionActive(token, id);
        
        if (response.success) {
            setSuccess('App version status updated!');
            await fetchVersions();
            setTimeout(() => setSuccess(''), 2000);
        } else {
            setError(response.message || 'Failed to toggle app version status');
        }
        setLoading(false);
    };

    const iosVersions = versions.filter(v => v.platform === 'ios');
    const androidVersions = versions.filter(v => v.platform === 'android');

    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-8 py-12">
                <header className="mb-12">
                    <div className="mb-6 flex items-center space-x-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
                            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold tracking-tight text-black">App Version Management</h1>
                            <p className="mt-1 text-base text-gray-600">Configure force and optional updates</p>
                        </div>
                        <button onClick={handleOpenCreateModal} className="rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-gray-900 active:scale-95">
                            + Add Version Config
                        </button>
                    </div>
                </header>

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

                {loading && versions.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="mt-4 text-sm font-medium text-gray-600">Loading versions...</p>
                        </div>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="text-center py-20">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No version configs yet</h3>
                        <p className="mt-2 text-sm text-gray-600">Get started by creating a version configuration.</p>
                        <button onClick={handleOpenCreateModal} className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white transition-all hover:bg-gray-900">
                            Create First Config
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <PlatformSection title="Android" versions={androidVersions} onEdit={handleOpenEditModal} onToggleActive={handleToggleActive} onDelete={setDeleteConfirmId} />
                        <PlatformSection title="iOS" versions={iosVersions} onEdit={handleOpenEditModal} onToggleActive={handleToggleActive} onDelete={setDeleteConfirmId} />
                    </div>
                )}

                {deleteConfirmId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-black">Delete Version Config?</h3>
                                <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirmId(null)} disabled={loading} className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 font-semibold text-black transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50">Cancel</button>
                                <button onClick={() => handleDelete(deleteConfirmId)} disabled={loading} className="flex-1 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50">{loading ? 'Deleting...' : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {showModal && <FormModal isCreating={isCreating} loading={loading} error={error} platform={platform} version={version} buildNumber={buildNumber} minVersion={minVersion} minBuildNumber={minBuildNumber} isForceUpdate={isForceUpdate} isOptionalUpdate={isOptionalUpdate} updateTitle={updateTitle} updateMessage={updateMessage} storeUrl={storeUrl} isActive={isActive} setPlatform={setPlatform} setVersion={setVersion} setBuildNumber={setBuildNumber} setMinVersion={setMinVersion} setMinBuildNumber={setMinBuildNumber} setIsForceUpdate={setIsForceUpdate} setIsOptionalUpdate={setIsOptionalUpdate} setUpdateTitle={setUpdateTitle} setUpdateMessage={setUpdateMessage} setStoreUrl={setStoreUrl} setIsActive={setIsActive} onClose={handleCloseModal} onSubmit={handleSubmit} />}
            </div>
        </Layout>
    );
};

const PlatformSection = ({ title, versions, onEdit, onToggleActive, onDelete }: any) => (
    <div>
        <h2 className="mb-4 flex items-center text-2xl font-bold text-black">
            {title === 'Android' ? (
                <svg className="mr-2 h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 00-.83.22l-1.88 3.24a11.43 11.43 0 00-8.94 0L5.65 5.67a.643.643 0 00-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.81 10.81 0 001 18h22a10.81 10.81 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/></svg>
            ) : (
                <svg className="mr-2 h-6 w-6 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            )}
            {title}
        </h2>
        {versions.length === 0 ? <p className="text-sm text-gray-500">No {title} version configurations</p> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {versions.map((ver: AppVersion) => <VersionCard key={ver._id} version={ver} onEdit={() => onEdit(ver)} onToggleActive={() => onToggleActive(ver._id)} onDelete={() => onDelete(ver._id)} />)}
            </div>
        )}
    </div>
);

const FormModal = ({ isCreating, loading, error, platform, version, buildNumber, minVersion, minBuildNumber, isForceUpdate, isOptionalUpdate, updateTitle, updateMessage, storeUrl, isActive, setPlatform, setVersion, setBuildNumber, setMinVersion, setMinBuildNumber, setIsForceUpdate, setIsOptionalUpdate, setUpdateTitle, setUpdateMessage, setStoreUrl, setIsActive, onClose, onSubmit }: any) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl my-8">
            <h2 className="mb-6 text-2xl font-bold text-black">{isCreating ? 'Create' : 'Edit'} Version Config</h2>
            {error && <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
            <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="mb-2 block text-sm font-semibold">Platform</label><select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" required><option value="android">Android</option><option value="ios">iOS</option></select></div>
                    <div><label className="mb-2 block text-sm font-semibold">Latest Version</label><input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" required /></div>
                    <div><label className="mb-2 block text-sm font-semibold">Latest Build</label><input type="number" value={buildNumber} onChange={(e) => setBuildNumber(e.target.value)} placeholder="100" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" required /></div>
                    <div><label className="mb-2 block text-sm font-semibold">Min Version</label><input type="text" value={minVersion} onChange={(e) => setMinVersion(e.target.value)} placeholder="1.0.0" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" required /></div>
                    <div className="col-span-2"><label className="mb-2 block text-sm font-semibold">Min Build (Force Update)</label><input type="number" value={minBuildNumber} onChange={(e) => setMinBuildNumber(e.target.value)} placeholder="90" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" required /></div>
                </div>
                <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                    <label className="flex items-center space-x-3"><input type="checkbox" checked={isForceUpdate} onChange={(e) => setIsForceUpdate(e.target.checked)} className="h-5 w-5 rounded" /><div><span className="font-semibold">Force Update</span><p className="text-xs text-gray-600">Block users below min build</p></div></label>
                    <label className="flex items-center space-x-3"><input type="checkbox" checked={isOptionalUpdate} onChange={(e) => setIsOptionalUpdate(e.target.checked)} className="h-5 w-5 rounded" /><div><span className="font-semibold">Optional Update</span><p className="text-xs text-gray-600">Show dialog but allow skip</p></div></label>
                    <label className="flex items-center space-x-3"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 rounded" /><div><span className="font-semibold">Active</span><p className="text-xs text-gray-600">One per platform</p></div></label>
                </div>
                <div><label className="mb-2 block text-sm font-semibold">Dialog Title</label><input type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder="Update Available" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" /></div>
                <div><label className="mb-2 block text-sm font-semibold">Dialog Message</label><textarea value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} placeholder="New version available..." rows={3} className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" /></div>
                <div><label className="mb-2 block text-sm font-semibold">Store URL</label><input type="url" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 focus:border-black focus:outline-none" /></div>
                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 font-semibold">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-black px-6 py-3 font-semibold text-white">{loading ? 'Saving...' : isCreating ? 'Create' : 'Update'}</button>
                </div>
            </form>
        </div>
    </div>
);

export default AppVersionsPage;
