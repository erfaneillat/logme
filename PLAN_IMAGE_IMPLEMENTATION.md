# Subscription Plan Image Upload Implementation

## Overview
Implemented image upload functionality for subscription plans, allowing admin users to upload images via the panel that are displayed in the Flutter app subscription page.

## Changes Made

### Backend (Server)

#### 1. Database Model (`server/src/models/SubscriptionPlan.ts`)
- Added `imageUrl?: string` field to the `ISubscriptionPlan` interface
- Added `imageUrl` field to the Mongoose schema

#### 2. Controller (`server/src/controllers/subscriptionPlanController.ts`)
- Added `imageUrl` parameter handling in `createPlan` and `updatePlan` methods
- Implemented `uploadPlanImage(id)` method for image uploads using multer
- Implemented `deletePlanImage(id)` method to delete plan images
- Added `deleteImageFile()` helper method to clean up image files from disk
- Updated `deletePlan` to automatically delete associated images

#### 3. Routes (`server/src/routes/subscriptionPlanRoutes.ts`)
- Added multer configuration for plan image uploads (5MB limit, image files only)
- Created uploads directory at `server/uploads/plans`
- Added route: `POST /:id/image` - Upload image for a plan
- Added route: `DELETE /:id/image` - Delete plan image
- Added route: `GET /images/:filename` - Serve plan images
- Added `imageUrl` to validation schemas

### Panel (Admin Frontend)

#### 1. Types (`panel/src/types/subscriptionPlan.ts`)
- Added `imageUrl?: string` to `SubscriptionPlan` interface
- Added `imageUrl?: string` to `CreatePlanInput` interface

#### 2. Service (`panel/src/services/subscriptionPlan.service.ts`)
- Implemented `uploadPlanImage(token, id, imageFile)` method
- Implemented `deletePlanImage(token, id)` method

#### 3. Plans Page (`panel/src/pages/PlansPage.tsx`)
- Added image upload UI to the create/edit modal:
  - Image preview component
  - File input with image selection
  - Upload button with size and format hints (5MB max)
  - Delete button for existing images
- Added image display in plan cards (140px height)
- State management for selected image and preview
- Automatic image upload after plan creation/update
- Image error handling with fallback

### Flutter App

#### 1. Model (`lib/features/subscription/data/models/subscription_plan_model.dart`)
- Added `imageUrl?: String` field
- Updated `fromJson` to parse imageUrl
- Updated `toJson` to include imageUrl

#### 2. Provider (`lib/features/subscription/presentation/providers/subscription_provider.dart`)
- Added `monthlyImageUrl`, `threeMonthImageUrl`, `yearlyImageUrl` to `SubscriptionState`
- Updated `_fetchPrices()` to populate image URLs from fetched plans
- Updated `copyWith()` method to include image URLs

#### 3. Subscription Page (`lib/features/subscription/pages/subscription_page.dart`)
- Updated `_buildHeroSection` to accept and display plan images
- Image priority: Yearly → 3-Month → Monthly → Default Unsplash fallback
- Constructs full image URL using `ApiConfig.baseUrl + imageUrl`
- Maintains existing error handling for failed image loads

## Features

### Panel Features
- ✅ Upload images when creating new plans
- ✅ Upload/change images when editing existing plans
- ✅ Delete images from plans
- ✅ Image preview in modal
- ✅ Image display in plan cards
- ✅ File validation (5MB max, image formats only)
- ✅ Automatic cleanup of old images when uploading new ones

### Flutter Features
- ✅ Display plan images in hero section of subscription page
- ✅ Fallback to default image if no plan image is available
- ✅ Priority system (yearly > 3-month > monthly)
- ✅ Error handling for failed image loads

## API Endpoints

### Image Management
- `POST /api/subscription-plans/:id/image` - Upload plan image (multipart/form-data, field: "image")
- `DELETE /api/subscription-plans/:id/image` - Delete plan image
- `GET /api/subscription-plans/images/:filename` - Serve plan images

### Image Storage
- Location: `server/uploads/plans/`
- Naming: `plan-{timestamp}-{random}.{ext}`
- Cleanup: Automatic deletion when plan is deleted or image is replaced

## Usage

### Uploading Images via Panel
1. Navigate to Plans page
2. Create new plan or edit existing plan
3. Click "📷 Upload Image" in the modal
4. Select an image file (max 5MB)
5. Preview appears immediately
6. Save the plan - image uploads automatically
7. To change image: click "📷 Change Image"
8. To remove image: click "Delete" button on the preview

### Viewing Images in Flutter App
- Images automatically appear in the subscription page hero section
- If multiple plans have images, yearly plan takes priority
- If no plan images exist, default placeholder is shown

## Technical Notes

- Image uploads use `multer` with disk storage
- Images are validated by MIME type and file extension
- Old images are automatically cleaned up to prevent orphaned files
- All image operations are authenticated (admin-only)
- Flutter app constructs full URLs using environment-aware base URL
- Images are cached by the network layer for performance

## Migration
No database migration required - `imageUrl` is an optional field and existing plans work without it.

## Testing Checklist
- [ ] Upload image when creating a new plan
- [ ] Upload image when editing an existing plan
- [ ] Change existing plan image
- [ ] Delete plan image
- [ ] Delete plan with image (verify image file is removed)
- [ ] View plan image in Flutter app
- [ ] Test image fallback when no image exists
- [ ] Test image error handling (invalid URL, network error)
- [ ] Verify 5MB file size limit
- [ ] Verify only image files are accepted
