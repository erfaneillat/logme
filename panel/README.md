# Cal AI Admin Panel

React + TypeScript + Tailwind CSS admin panel for Cal AI.

## Features

- 🔐 Phone + OTP Authentication
- 👤 Admin-only access with `isAdmin` flag verification
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast development with Vite
- 🔒 Protected routes with authentication context

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
cd panel
npm install
```

### Development

```bash
npm run dev
```

The panel will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Authentication Flow

1. **Phone Entry**: User enters their phone number
2. **OTP Sent**: Server sends a 6-digit verification code via SMS
3. **Code Verification**: User enters the code
4. **Admin Check**: Server verifies the user has `isAdmin: true` flag
5. **JWT Token**: If verified, user receives a JWT token with 7-day expiry
6. **Dashboard Access**: User can access the admin dashboard

## Project Structure

```
panel/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── ProtectedRoute.tsx
│   ├── config/          # Configuration files
│   │   └── api.ts
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/           # Page components
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx
│   ├── services/        # API services
│   │   └── auth.service.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.ts   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## API Endpoints

The panel communicates with these server endpoints:

- `POST /api/auth/send-code` - Send verification code to phone
- `POST /api/auth/admin/verify-phone` - Verify code and admin status
- `GET /api/auth/profile` - Get current user profile

## Environment Variables

Create a `.env` file in the panel directory (optional):

```env
# API Base URL (defaults to http://localhost:9000 in dev)
VITE_API_BASE_URL=http://localhost:9000
```

## Creating an Admin User

To make a user an admin, you need to manually set the `isAdmin` flag in MongoDB:

```javascript
// Connect to MongoDB and run:
db.users.updateOne(
  { phone: '+1234567890' },  // Replace with admin phone number
  { $set: { isAdmin: true } }
);
```

Or use MongoDB Compass/Atlas UI to set `isAdmin: true` for the user.

## Security Notes

- Admin tokens are stored in localStorage
- Tokens expire after 7 days
- Only users with `isAdmin: true` can authenticate
- Protected routes automatically redirect to login
- Token validation on every protected request

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **JWT** - Authentication

## Next Steps

1. Add more admin features (user management, analytics, etc.)
2. Implement routing with React Router
3. Add more protected pages
4. Create admin-specific API endpoints
5. Add data tables and charts
6. Implement real-time updates

## Troubleshooting

### Cannot connect to server

Make sure the server is running on `http://localhost:9000`:

```bash
cd ../server
npm start
```

### Admin login fails

Verify the user has `isAdmin: true` in the database and the phone number is correct.

### CORS errors

The server should have CORS configured to allow requests from `http://localhost:5173` in development.

