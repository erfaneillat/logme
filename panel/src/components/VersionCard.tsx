import { AppVersion } from '../types/appVersion';

interface VersionCardProps {
    version: AppVersion;
    onEdit: () => void;
    onToggleActive: () => void;
    onDelete: () => void;
}

const VersionCard = ({ version, onEdit, onToggleActive, onDelete }: VersionCardProps) => {
    return (
        <div className={`rounded-2xl border-2 bg-white p-6 shadow-lg transition-all ${version.isActive ? 'border-black' : 'border-gray-200'}`}>
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-black">{version.version}</h3>
                    <p className="text-sm text-gray-600">Build {version.buildNumber}</p>
                </div>
                {version.isActive && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Active
                    </span>
                )}
            </div>

            <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Min Version:</span>
                    <span className="font-semibold text-black">
                        {version.minVersion} ({version.minBuildNumber})
                    </span>
                </div>
                
                {version.isForceUpdate && (
                    <div className="flex items-center space-x-2 rounded-lg bg-red-50 px-3 py-2">
                        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                        </svg>
                        <span className="font-medium text-red-800">Force Update</span>
                    </div>
                )}

                {version.isOptionalUpdate && (
                    <div className="flex items-center space-x-2 rounded-lg bg-blue-50 px-3 py-2">
                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-blue-800">Optional Update</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onEdit}
                    className="flex-1 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                    Edit
                </button>
                <button
                    onClick={onToggleActive}
                    className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-semibold transition hover:bg-gray-50"
                >
                    {version.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                    onClick={onDelete}
                    className="rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default VersionCard;
