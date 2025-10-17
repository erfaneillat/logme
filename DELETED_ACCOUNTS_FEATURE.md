# Deleted Accounts Management Feature

## Overview
Added a comprehensive deleted accounts management panel that allows administrators to view and filter deleted user accounts in the admin panel.

## Changes Made

### Backend (Server)

#### 1. **User Controller** (`server/src/controllers/userController.ts`)
Added two new methods:
- `listDeleted()`: List deleted users with filtering and pagination
  - Supports search by name, phone, email, referral code
  - Supports date range filtering (deletedAt)
  - Supports custom sorting
  - Returns paginated results

- `getDeletedById()`: Get a specific deleted user by ID
  - Returns the complete deleted user data

#### 2. **User Routes** (`server/src/routes/userRoutes.ts`)
Added two new routes:
- `GET /api/users/deleted/list` - List deleted users (admin required)
- `GET /api/users/deleted/:id` - Get specific deleted user (admin required)

**Note**: Routes are placed before the generic `/:id` route to ensure proper Express routing priority

### Frontend (Panel)

#### 1. **Types** (`panel/src/types/user.ts`)
- Added `DeletedUser` interface with all deleted user metadata
- Includes deletion reason, deletion timestamp, and who deleted it (admin/user/system)

#### 2. **User Service** (`panel/src/services/user.service.ts`)
Added two new methods:
- `listDeleted()`: Fetch paginated list of deleted users with filters
- `getDeletedById()`: Fetch a specific deleted user

#### 3. **New Page** (`panel/src/pages/DeletedUsersPage.tsx`)
Created comprehensive deleted accounts management page with:
- **Header Section**: Title, deleted account count, and active filters display
- **Filters & Search**:
  - Text search (name, phone, email)
  - Date range filtering (deleted from/to)
  - Clear all filters button
- **Table Display**:
  - User info (name, referral code)
  - Contact information (phone, email)
  - Deletion info (deleted by admin/user/system, deletion reason)
  - Status badges (verified/unverified, premium status)
  - Deletion date and time
- **Pagination**: Page info, per-page selector, navigation buttons
- **Empty State**: Helpful message when no deleted accounts found
- **Loading State**: Spinner with loading message

#### 4. **Router Update** (`panel/src/App.tsx`)
- Imported `DeletedUsersPage` component
- Added route: `/deleted-users` -> `<DeletedUsersPage />`

#### 5. **Sidebar Navigation** (`panel/src/components/Sidebar.tsx`)
- Added new navigation item "Deleted Accounts"
- Positioned after "Users" in the navigation menu
- Includes trash icon for visual recognition
- Fully styled to match existing navigation items

### Model

#### Backend Model: `DeletedUser` (`server/src/models/DeletedUser.ts`)
Already exists with proper schema including:
- Original user ID reference
- All user data snapshot
- Deletion metadata (reason, timestamp, deleted by)
- Indexed fields for efficient querying

## Features

### Administrator Capabilities
1. **View Deleted Accounts**: Browse all deleted user accounts
2. **Search & Filter**:
   - Find deleted accounts by name, phone, or email
   - Filter by deletion date range
   - Search by referral code
3. **View Deletion Details**:
   - Who deleted the account (admin/user/system)
   - Deletion reason (if provided)
   - When the account was deleted
4. **Account Status**: See verification status and whether account had premium subscription

### UI/UX Features
- Modern, responsive design matching existing panel style
- Consistent with other admin pages
- Clear visual indicators for deleted account status
- Intuitive pagination and filtering
- Loading and empty states
- Professional color scheme with red accents for deleted state

## API Endpoints

### List Deleted Users
```
GET /api/users/deleted/list
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - search: string (searches name, phone, email, referralCode)
  - dateFrom: ISO date string
  - dateTo: ISO date string
  - sort: string (default: "-deletedAt")

Response:
{
  success: boolean,
  data: {
    items: DeletedUser[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
}
```

### Get Deleted User by ID
```
GET /api/users/deleted/:id

Response:
{
  success: boolean,
  data: {
    user: DeletedUser
  }
}
```

## Audit Trail
- Deletion reason is captured for audit purposes
- User who deleted the account is tracked (admin/user/system)
- Deletion timestamp is recorded

## Future Enhancements
- Restore/undelete functionality
- Export deleted accounts list (CSV/Excel)
- Advanced analytics on deletion patterns
- Automated deletion retention policies
- Detailed deletion logs per account

## Testing Recommendations
1. Test filtering with various date ranges
2. Test search functionality with different keywords
3. Verify pagination works correctly
4. Test with accounts deleted by different sources (admin/user/system)
5. Verify deletion reasons display correctly when present
