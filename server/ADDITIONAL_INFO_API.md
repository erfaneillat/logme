# Additional Information API

This document describes the additional information API endpoints that have been added to support the user profile completion flow.

## Overview

The additional information API allows users to save their profile information (gender, age, weight, height, activity level, weight goal) and marks when they have completed this information. This is used to determine whether to show the additional information flow or redirect directly to the home page after login.

## Database Schema Changes

### User Model Updates

The `User` model has been updated to include:

```typescript
hasCompletedAdditionalInfo: {
  type: Boolean,
  default: false,
}
```

### New AdditionalInfo Model

A new `AdditionalInfo` model has been created to store user profile data:

```typescript
{
  userId: ObjectId (ref: 'User'),
  gender: String (enum: ['male', 'female', 'other']),
  age: Number (1-120),
  weight: Number (20-300 kg),
  height: Number (100-250 cm),
  activityLevel: String (enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  weightGoal: String (enum: ['lose_weight', 'maintain_weight', 'gain_weight']),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### 1. Save Additional Information

**POST** `/api/user/additional-info`

Saves or updates the user's additional information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "gender": "male",
  "age": 25,
  "weight": 70.5,
  "height": 175.0,
  "activityLevel": "moderately_active",
  "weightGoal": "lose_weight"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Additional information saved successfully",
  "data": {
    "additionalInfo": {
      "userId": "user_id",
      "gender": "male",
      "age": 25,
      "weight": 70.5,
      "height": 175.0,
      "activityLevel": "moderately_active",
      "weightGoal": "lose_weight",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Get Additional Information

**GET** `/api/user/additional-info`

Retrieves the user's additional information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "additionalInfo": {
      "userId": "user_id",
      "gender": "male",
      "age": 25,
      "weight": 70.5,
      "height": 175.0,
      "activityLevel": "moderately_active",
      "weightGoal": "lose_weight",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Mark Additional Information Completed

**POST** `/api/user/mark-additional-info-completed`

Marks the user as having completed their additional information. This updates the `hasCompletedAdditionalInfo` field in the User model.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Additional information marked as completed"
}
```

## Updated Auth Endpoints

### Phone Verification Response

The phone verification endpoint now includes the `hasCompletedAdditionalInfo` flag:

**POST** `/api/auth/verify-phone`

**Response:**
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "phone": "+1234567890",
      "name": "User Name",
      "email": "user@example.com",
      "isPhoneVerified": true,
      "hasCompletedAdditionalInfo": false
    }
  }
}
```

## Validation Rules

### Additional Information Validation

- **gender**: Must be one of: `male`, `female`, `other`
- **age**: Must be between 1 and 120
- **weight**: Must be between 20 and 300 kg
- **height**: Must be between 100 and 250 cm
- **activityLevel**: Must be one of: `sedentary`, `lightly_active`, `moderately_active`, `very_active`
- **weightGoal**: Must be one of: `lose_weight`, `maintain_weight`, `gain_weight`

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "invalid_value",
      "msg": "Validation error message",
      "path": "field_name",
      "location": "body"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Access token is missing"
}
```

### User Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### Incomplete Information
```json
{
  "success": false,
  "message": "Additional information is incomplete"
}
```

## Testing

You can test the API endpoints using the provided test script:

```bash
cd server
node test-additional-info.js
```

This script will:
1. Send a verification code
2. Verify the phone number
3. Save additional information
4. Retrieve additional information
5. Mark additional information as completed
6. Verify the user profile shows the completion flag

## Flow Integration

The additional information flow integrates with the existing authentication system:

1. **Login**: User logs in with phone verification
2. **Check Completion**: Backend returns `hasCompletedAdditionalInfo` flag
3. **Redirect Logic**: 
   - If `true` → Navigate to home
   - If `false` → Navigate to additional info flow
4. **Complete Flow**: User fills out additional information
5. **Mark Complete**: Backend marks user as having completed additional info
6. **Final Redirect**: User is redirected to home

## Security Considerations

- All additional information endpoints require authentication
- User can only access their own additional information
- Validation ensures data integrity
- JWT tokens are used for authentication 