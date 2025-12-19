import { useState, useEffect } from 'react';
import { KitchenCategory, KitchenSubCategory, KitchenItem, Ingredient } from '../types/kitchen';
import { kitchenService } from '../services/kitchen.service';
import { useAuth } from '../contexts/AuthContext';

interface KitchenCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData: KitchenCategory | null;
}

const KitchenCategoryModal: React.FC<KitchenCategoryModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<KitchenCategory>>({
        title: '',
        isActive: true,
        order: 0,
        subCategories: []
    });

    // SubCategory editing state
    const [editingSubCatIndex, setEditingSubCatIndex] = useState<number | null>(null);
    const [subCatFormData, setSubCatFormData] = useState<Partial<KitchenSubCategory>>({
        title: '',
        items: []
    });
    const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);

    // Item editing state (within a subcategory)
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [itemFormData, setItemFormData] = useState<Partial<KitchenItem>>({
        name: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        image: '🥣',
        prepTime: '15 min',
        difficulty: 'medium'
    });
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [importing, setImporting] = useState(false);

    // Image generation state
    const [generatingImages, setGeneratingImages] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<string>('');
    const [generatingSingleImage, setGeneratingSingleImage] = useState(false);
    const [compressingImages, setCompressingImages] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                isActive: initialData.isActive,
                order: initialData.order,
                subCategories: initialData.subCategories || []
            });
        } else {
            setFormData({
                title: '',
                isActive: true,
                order: 0,
                subCategories: []
            });
        }
    }, [initialData]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!token) return;

        setLoading(true);
        try {
            if (initialData && initialData._id) {
                await kitchenService.updateCategory(token, initialData._id, formData);
            } else {
                await kitchenService.createCategory(token, formData as any);
            }
            onSave();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!token || !initialData?._id) {
            alert('Please create and save the category first before importing items.');
            return;
        }

        try {
            const items = JSON.parse(importJson);
            if (!Array.isArray(items)) {
                alert('Invalid JSON: Must be an array of items.');
                return;
            }

            setImporting(true);
            const result = await kitchenService.importItems(token, initialData._id, items);

            if (result.success) {
                alert(result.message);
                setIsImportModalOpen(false);
                setImportJson('');
                // Ideally reload the category data or just close/save
                onSave();
            } else {
                alert('Import failed: ' + result.message);
            }
        } catch (e) {
            alert('Invalid JSON format.');
        } finally {
            setImporting(false);
        }
    };

    // SubCategory handlers
    const handleAddSubCategory = () => {
        setEditingSubCatIndex(null);
        setSubCatFormData({ title: '', items: [] });
        setIsSubCatModalOpen(true);
    };

    const handleEditSubCategory = (index: number) => {
        setEditingSubCatIndex(index);
        setSubCatFormData({ ...formData.subCategories![index] });
        setIsSubCatModalOpen(true);
    };

    const handleDeleteSubCategory = (index: number) => {
        if (window.confirm('Delete this subcategory and all its items?')) {
            const newSubCategories = [...(formData.subCategories || [])];
            newSubCategories.splice(index, 1);
            setFormData({ ...formData, subCategories: newSubCategories });
        }
    };

    const saveSubCategory = () => {
        if (!subCatFormData.title) {
            alert('Subcategory title is required');
            return;
        }

        const newSubCategories = [...(formData.subCategories || [])];
        if (editingSubCatIndex !== null) {
            newSubCategories[editingSubCatIndex] = subCatFormData as KitchenSubCategory;
        } else {
            newSubCategories.push(subCatFormData as KitchenSubCategory);
        }
        setFormData({ ...formData, subCategories: newSubCategories });
        setIsSubCatModalOpen(false);
    };

    // Item handlers (within subcategory modal)
    const handleAddItem = () => {
        setEditingItemIndex(null);
        setItemFormData({
            name: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            image: '🥣',
            prepTime: '15 min',
            difficulty: 'medium',
            imagePrompt: '',
            ingredients: [],
            instructions: ''
        });
        setIsItemModalOpen(true);
    };

    const handleEditItem = (index: number) => {
        setEditingItemIndex(index);
        const item = subCatFormData.items![index];
        // Sanitize image: if it's a long string that is not a URL, it's likely a prompt/garbage
        let image = item.image || '🥣';
        if (image && !image.startsWith('http') && image.length > 30) {
            image = '';
        }

        setItemFormData({ ...item, image });
        setIsItemModalOpen(true);
    };

    const handleDeleteItem = (index: number) => {
        if (window.confirm('Delete this item?')) {
            const newItems = [...(subCatFormData.items || [])];
            newItems.splice(index, 1);
            setSubCatFormData({ ...subCatFormData, items: newItems });
        }
    };

    const saveItem = () => {
        if (!itemFormData.name) {
            alert('Item name is required');
            return;
        }

        const newItems = [...(subCatFormData.items || [])];
        if (editingItemIndex !== null) {
            newItems[editingItemIndex] = itemFormData as KitchenItem;
        } else {
            newItems.push(itemFormData as KitchenItem);
        }
        setSubCatFormData({ ...subCatFormData, items: newItems });
        setIsItemModalOpen(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setUploadingImage(true);
        try {
            const result = await kitchenService.uploadImage(token, file);
            if (result.success && result.url) {
                setItemFormData(prev => ({ ...prev, image: result.url }));
            } else {
                alert('Image upload failed: ' + result.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Image upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const getTotalItems = () => {
        return formData.subCategories?.reduce((sum, sub) => sum + (sub.items?.length || 0), 0) || 0;
    };

    const handleGenerateImages = async (forceRegenerate: boolean = false) => {
        if (!token || !initialData?._id || editingSubCatIndex === null) {
            alert('Please save the category first before generating images.');
            return;
        }

        const items = subCatFormData.items || [];

        // Find items with prompts
        const itemsWithPrompts = items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) =>
                item.imagePrompt &&
                item.imagePrompt.trim().length > 0
            );

        if (itemsWithPrompts.length === 0) {
            alert('No items with image prompts found. Add image prompts to items first.');
            return;
        }

        // Filter based on whether we're force regenerating
        let itemsToGenerate = forceRegenerate
            ? itemsWithPrompts
            : itemsWithPrompts.filter(({ item }) => !item.image?.startsWith('http'));

        if (itemsToGenerate.length === 0) {
            // All items already have images - ask if they want to regenerate
            if (window.confirm(`All ${itemsWithPrompts.length} items already have images. Do you want to regenerate ALL images? This will replace existing images.`)) {
                itemsToGenerate = itemsWithPrompts;
            } else {
                return;
            }
        }

        if (!window.confirm(`This will generate images for ${itemsToGenerate.length} items. Each may take 30-60 seconds. Continue?`)) {
            return;
        }

        setGeneratingImages(true);

        let generatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        const updatedItems = [...items];

        for (let i = 0; i < itemsToGenerate.length; i++) {
            const { item, index } = itemsToGenerate[i];
            setGenerationProgress(`Generating ${i + 1}/${itemsToGenerate.length}: ${item.name}...`);

            try {
                const result = await kitchenService.generateImageForItem(
                    token,
                    initialData._id,
                    editingSubCatIndex,
                    index
                );

                if (result.success && result.imageUrl) {
                    // Update local state with new image
                    updatedItems[index] = { ...updatedItems[index], image: result.imageUrl };
                    generatedCount++;
                } else if (result.skipped) {
                    skippedCount++;
                } else {
                    errorCount++;
                    console.error(`Failed to generate for ${item.name}:`, result.error || result.message);
                }
            } catch (error) {
                errorCount++;
                console.error(`Error generating for ${item.name}:`, error);
            }

            // Small delay between requests
            if (i < itemsToGenerate.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Update local state with all new images
        setSubCatFormData(prev => ({ ...prev, items: updatedItems }));

        // Update main form data too
        setFormData(prev => {
            const newSubCategories = [...(prev.subCategories || [])];
            if (newSubCategories[editingSubCatIndex]) {
                newSubCategories[editingSubCatIndex] = {
                    ...newSubCategories[editingSubCatIndex],
                    items: updatedItems
                };
            }
            return { ...prev, subCategories: newSubCategories };
        });

        setGenerationProgress(`Done! Generated: ${generatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
        alert(`Image generation completed!\nGenerated: ${generatedCount}\nSkipped: ${skippedCount}\nErrors: ${errorCount}`);

        setGeneratingImages(false);
    };

    const handleGenerateSingleImage = async () => {
        if (!token || !initialData?._id || editingSubCatIndex === null || editingItemIndex === null) {
            alert('Please save the category and item first.');
            return;
        }

        if (!itemFormData.imagePrompt || itemFormData.imagePrompt.trim().length === 0) {
            alert('Please enter an image prompt first.');
            return;
        }

        setGeneratingSingleImage(true);

        try {
            const result = await kitchenService.generateImageForItem(
                token,
                initialData._id,
                editingSubCatIndex,
                editingItemIndex
            );

            if (result.success && result.imageUrl) {
                // Update the item's image in local state
                setItemFormData(prev => ({ ...prev, image: result.imageUrl }));
                alert('Image generated successfully!');
            } else {
                alert('Failed to generate image: ' + (result.error || result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Single image generation error:', error);
            alert('Error generating image. Please try again.');
        } finally {
            setGeneratingSingleImage(false);
        }
    };

    const handleCompressImages = async () => {
        if (!token || !initialData?._id) {
            alert('Please save the category first.');
            return;
        }

        if (!window.confirm('This will compress all PNG images to WebP format (smaller file size). Continue?')) {
            return;
        }

        setCompressingImages(true);

        try {
            const result = await kitchenService.compressImagesForCategory(token, initialData._id);

            if (result.success) {
                if (result.processed && result.processed > 0) {
                    alert(`Compression complete!\n\nProcessed: ${result.processed} images\nSkipped: ${result.skipped}\nErrors: ${result.errors}\n\nSaved: ${result.savedMB}MB (${result.savingsPercent}% smaller)`);
                } else {
                    alert('No PNG images found to compress. All images may already be in WebP format.');
                }
            } else {
                alert('Failed to compress images: ' + result.message);
            }
        } catch (error) {
            console.error('Compress images error:', error);
            alert('Error compressing images. Please try again.');
        } finally {
            setCompressingImages(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            {/* Main Category Modal */}
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Category' : 'New Kitchen Category'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {formData.subCategories?.length || 0} subcategories • {getTotalItems()} items
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {initialData?._id && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCompressImages}
                                    disabled={compressingImages}
                                    className="px-4 py-2 bg-white text-green-600 border border-green-200 text-sm font-bold rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {compressingImages ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
                                            Compressing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            Compress
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="px-4 py-2 bg-white text-orange-600 border border-orange-200 text-sm font-bold rounded-xl hover:bg-orange-50 transition-colors"
                                >
                                    Import JSON
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50 transition-colors">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Info */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-gray-50 focus:bg-white text-lg font-semibold"
                                    placeholder="e.g. Breakfast, Lunch, Dinner"
                                />
                            </div>
                            <div className="w-full md:w-28">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Order</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black focus:ring-black transition-all bg-gray-50 focus:bg-white text-center font-bold"
                                />
                            </div>
                            <div className="pt-8">
                                <label className="flex items-center space-x-3 cursor-pointer select-none px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="h-5 w-5 rounded border-gray-300 text-black focus:ring-black transition duration-200"
                                    />
                                    <span className="text-sm font-bold text-gray-700">Active</span>
                                </label>
                            </div>
                        </div>

                        {/* SubCategories Section */}
                        <div className="border-t border-dashed border-gray-200 pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-gray-900">Subcategories</h3>
                                    <span className="bg-orange-100 text-orange-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                                        {formData.subCategories?.length || 0}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddSubCategory}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Subcategory
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.subCategories?.map((subCat, index) => (
                                    <div key={index} className="border border-gray-200 rounded-2xl p-5 hover:border-orange-200 transition-all bg-white relative group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-200">
                                                    {subCat.title.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{subCat.title}</h4>
                                                    <p className="text-xs text-gray-500">{subCat.items?.length || 0} items</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditSubCategory(index)}
                                                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSubCategory(index)}
                                                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Item previews */}
                                        {subCat.items && subCat.items.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                                                {subCat.items.slice(0, 5).map((item, itemIdx) => (
                                                    <div key={itemIdx} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-xs">
                                                        <span>{item.image?.startsWith('http') ? '📷' : item.image}</span>
                                                        <span className="text-gray-600 truncate max-w-[80px]">{item.name}</span>
                                                    </div>
                                                ))}
                                                {subCat.items.length > 5 && (
                                                    <div className="bg-gray-100 px-2 py-1 rounded-lg text-xs text-gray-500 font-medium">
                                                        +{subCat.items.length - 5} more
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddSubCategory}
                                    className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-gray-400 hover:text-orange-500 min-h-[120px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold">Add Subcategory</span>
                                    <span className="text-xs font-medium">e.g. Protein-rich, Quick meals</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-black font-bold text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        )}
                        {loading ? 'Saving...' : (initialData ? 'Update Category' : 'Create Category')}
                    </button>
                </div>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900">Import Kitchen Items</h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Paste JSON Data</label>
                            <p className="text-xs text-gray-500 mb-4">
                                JSON must be an array of objects. Each object should have 'name', 'category' (subcategory), 'difficulty', etc.
                            </p>
                            <textarea
                                className="w-full h-64 p-4 rounded-xl border border-gray-200 bg-gray-50 font-mono text-xs focus:bg-white focus:border-black outline-none resize-none"
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                placeholder='[{"name": "Food Name", "category": "Subcat Title", ...}]'
                            ></textarea>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing || !importJson}
                                    className="px-6 py-2.5 rounded-xl bg-black font-bold text-white hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {importing && (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    )}
                                    {importing ? 'Importing...' : 'Import Items'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SubCategory Edit Modal */}
            {isSubCatModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">
                                    {editingSubCatIndex !== null ? 'Edit Subcategory' : 'New Subcategory'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">{subCatFormData.items?.length || 0} items</p>
                            </div>
                            <button onClick={() => setIsSubCatModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Subcategory Title */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subcategory Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                                    value={subCatFormData.title || ''}
                                    onChange={e => setSubCatFormData({ ...subCatFormData, title: e.target.value })}
                                    placeholder="e.g. Protein-rich, Fast, Low-calorie"
                                />
                            </div>

                            {/* Items within subcategory */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Food Items</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Item
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {subCatFormData.items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl overflow-hidden shadow-sm border border-gray-100 shrink-0">
                                                {item.image?.startsWith('http') ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{(item.image && item.image.length <= 30) ? item.image : ''}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-medium text-orange-500">{item.calories} kcal</span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">{item.prepTime}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditItem(index)}
                                                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(index)}
                                                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {(!subCatFormData.items || subCatFormData.items.length === 0) && (
                                        <button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50/30 transition-all text-gray-400 hover:text-orange-500"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-bold">Add your first food item</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 space-y-3">
                            {/* Generate Images Button */}
                            {editingSubCatIndex !== null && initialData?._id && (
                                <button
                                    type="button"
                                    onClick={() => handleGenerateImages()}
                                    disabled={generatingImages}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                                >
                                    {generatingImages ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Generating Images...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Generate Image for All</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Progress indicator */}
                            {generationProgress && (
                                <div className="text-center text-sm text-purple-600 font-medium bg-purple-50 px-4 py-2 rounded-lg">
                                    {generationProgress}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <button onClick={() => setIsSubCatModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={saveSubCategory} className="flex-1 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20">
                                    {editingSubCatIndex !== null ? 'Update Subcategory' : 'Add Subcategory'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Edit Modal */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 flex flex-col max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">{editingItemIndex !== null ? 'Edit Item' : 'New Item'}</h3>
                            <button onClick={() => setIsItemModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image</label>
                                <div className="flex items-start gap-4">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-4xl overflow-hidden shrink-0 relative">
                                        {itemFormData.image?.startsWith('http') ? (
                                            <img src={itemFormData.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="filter drop-shadow">{itemFormData.image}</span>
                                        )}
                                        {uploadingImage && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <label className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 text-sm font-bold text-center text-gray-700 transition-colors flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Upload Image
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-100"></div>
                                            <span className="relative z-10 bg-white px-2 text-xs font-medium text-gray-400 ml-2">or use emoji/url</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium"
                                            value={itemFormData.image || ''}
                                            onChange={e => setItemFormData({ ...itemFormData, image: e.target.value })}
                                            placeholder="Paste URL (http/https) or Type Emoji (e.g. 🥣)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                                    value={itemFormData.name || ''} onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })} placeholder="e.g. Oatmeal Bowl" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prep Time</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none transition-all font-medium"
                                        value={itemFormData.prepTime || ''} onChange={e => setItemFormData({ ...itemFormData, prepTime: e.target.value })} placeholder="e.g. 15 min" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none transition-all font-medium appearance-none"
                                        value={itemFormData.difficulty} onChange={e => setItemFormData({ ...itemFormData, difficulty: e.target.value as any })}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Nutritional Info (per serving)</label>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <label className="block text-[10px] font-bold text-orange-500 uppercase mb-1">Calories</label>
                                        <input type="number" className="w-full p-2 text-center rounded-lg border border-gray-200 bg-white shadow-sm font-bold"
                                            value={itemFormData.calories || 0} onChange={e => setItemFormData({ ...itemFormData, calories: Number(e.target.value) })} />
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Protein</label>
                                        <input type="number" className="w-full p-2 text-center rounded-lg border border-gray-200 bg-white shadow-sm font-bold"
                                            value={itemFormData.protein || 0} onChange={e => setItemFormData({ ...itemFormData, protein: Number(e.target.value) })} />
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Carbs</label>
                                        <input type="number" className="w-full p-2 text-center rounded-lg border border-gray-200 bg-white shadow-sm font-bold"
                                            value={itemFormData.carbs || 0} onChange={e => setItemFormData({ ...itemFormData, carbs: Number(e.target.value) })} />
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fat</label>
                                        <input type="number" className="w-full p-2 text-center rounded-lg border border-gray-200 bg-white shadow-sm font-bold"
                                            value={itemFormData.fat || 0} onChange={e => setItemFormData({ ...itemFormData, fat: Number(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            {/* Ingredients */}
                            <div dir="rtl">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">مواد لازم (Ingredients)</label>
                                    <button
                                        type="button"
                                        onClick={() => setItemFormData({
                                            ...itemFormData,
                                            ingredients: [...(itemFormData.ingredients || []), { name: '', amount: '' }]
                                        })}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        + افزودن مورد
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {(itemFormData.ingredients || []).map((ing, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none text-sm text-right"
                                                value={ing.name}
                                                onChange={e => {
                                                    const newIngredients = [...(itemFormData.ingredients || [])];
                                                    newIngredients[idx] = { ...newIngredients[idx], name: e.target.value };
                                                    setItemFormData({ ...itemFormData, ingredients: newIngredients });
                                                }}
                                                placeholder="نام ماده"
                                            />
                                            <input
                                                type="text"
                                                className="w-24 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none text-sm text-right"
                                                value={ing.amount}
                                                onChange={e => {
                                                    const newIngredients = [...(itemFormData.ingredients || [])];
                                                    newIngredients[idx] = { ...newIngredients[idx], amount: e.target.value };
                                                    setItemFormData({ ...itemFormData, ingredients: newIngredients });
                                                }}
                                                placeholder="مقدار"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newIngredients = [...(itemFormData.ingredients || [])];
                                                    newIngredients.splice(idx, 1);
                                                    setItemFormData({ ...itemFormData, ingredients: newIngredients });
                                                }}
                                                className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 shrink-0"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {(!itemFormData.ingredients || itemFormData.ingredients.length === 0) && (
                                        <p className="text-sm text-gray-400 text-center py-2">هنوز موردی اضافه نشده است</p>
                                    )}
                                </div>
                            </div>

                            {/* Instructions */}
                            <div dir="rtl">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-right">طرز تهیه (Instructions)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium resize-none h-32 text-right"
                                    value={itemFormData.instructions || ''}
                                    onChange={e => setItemFormData({ ...itemFormData, instructions: e.target.value })}
                                    placeholder="مراحل تهیه را بنویسید..."
                                />
                            </div>

                            {/* Image Prompt */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Image Prompt</label>
                                    {editingItemIndex !== null && initialData?._id && editingSubCatIndex !== null && (
                                        <button
                                            type="button"
                                            onClick={handleGenerateSingleImage}
                                            disabled={generatingSingleImage || !itemFormData.imagePrompt?.trim()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generatingSingleImage ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                    </svg>
                                                    <span>Generate Image</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium resize-none h-28 text-sm"
                                    value={itemFormData.imagePrompt || ''}
                                    onChange={e => setItemFormData({ ...itemFormData, imagePrompt: e.target.value })}
                                    placeholder="AI Image Generation Prompt..."
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 pt-6 border-t border-gray-100">
                            <button onClick={() => setIsItemModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={saveItem} className="flex-1 py-3.5 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20">
                                {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KitchenCategoryModal;
