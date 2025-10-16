# Error Logging System Implementation Guide

## Overview

A comprehensive error logging system has been implemented for both the server (Node.js/Express) and panel (React/TypeScript) to track, monitor, and analyze errors across the application.

## Server Implementation

### Core Components

#### 1. Error Logger Service (`server/src/services/errorLoggerService.ts`)

The main service that handles all error logging operations.

**Features:**
- **Multiple log levels**: INFO, WARNING, ERROR, CRITICAL
- **File-based logging**: Logs are written to files organized by level and date
- **Automatic log rotation**: Prevents log files from growing too large
- **Context extraction**: Automatically captures request details (endpoint, method, IP, user agent, etc.)
- **Data sanitization**: Removes sensitive information (passwords, tokens, etc.) from logs
- **Critical error handling**: Special handling for critical errors (can be extended for alerts)

**Usage Example:**
```typescript
import errorLogger from '../services/errorLoggerService';

// Log an error with request context
errorLogger.error('Failed to create user', error, req, { userId: '123' });

// Log a warning
errorLogger.warning('Rate limit approaching', undefined, req);

// Log info
errorLogger.info('User logged in successfully', req, { userId: '123' });

// Log critical error
errorLogger.critical('Database connection lost', error, req);
```

#### 2. Error Handler Middleware (`server/src/middleware/errorHandler.ts`)

Enhanced to automatically log all errors that pass through the Express error handling middleware.

**Features:**
- Automatic error classification by severity
- Integration with error logger service
- Detailed error context capture

#### 3. Error Log Controller (`server/src/controllers/errorLogController.ts`)

Provides API endpoints for managing and viewing error logs.

**Endpoints:**
- `GET /api/error-logs` - Retrieve error logs (admin only)
- `GET /api/error-logs/stats` - Get error statistics (admin only)
- `POST /api/error-logs` - Manually create log entry (admin only)

**Query Parameters for GET /api/error-logs:**
- `level` - Filter by error level (INFO, WARNING, ERROR, CRITICAL)
- `date` - Filter by date (YYYY-MM-DD format)
- `limit` - Number of logs to retrieve (default: 100, max: 1000)

### Integration in Controllers

Example from `ticketController.ts`:

```typescript
import errorLogger from '../services/errorLoggerService';

export class TicketController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      // Controller logic...
    } catch (error) {
      errorLogger.error('Create ticket error', error as Error, req, { 
        userId: (req as any).user?.userId 
      });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
```

### Log File Structure

Logs are stored in the `server/logs/` directory:
```
logs/
├── error-2024-01-15.log
├── warning-2024-01-15.log
├── info-2024-01-15.log
├── critical-2024-01-15.log
└── ...
```

Each log entry is a JSON object:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "ERROR",
  "message": "Failed to create ticket",
  "stack": "Error: Database connection failed...",
  "context": {
    "userId": "507f1f77bcf86cd799439011",
    "endpoint": "/api/tickets",
    "method": "POST",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "requestBody": { "subject": "Help needed" },
    "requestParams": {},
    "requestQuery": {}
  },
  "metadata": {
    "statusCode": 500,
    "errorName": "MongoError"
  }
}
```

## Panel Implementation

### Core Components

#### 1. Error Logger Service (`panel/src/services/errorLogger.service.ts`)

Client-side error logging service with local storage and server synchronization.

**Features:**
- **Multiple log levels**: INFO, WARNING, ERROR, CRITICAL
- **Local storage**: Logs stored in browser localStorage
- **Server synchronization**: ERROR and CRITICAL logs sent to server
- **Context extraction**: Captures URL, user agent, and custom context
- **Data sanitization**: Removes sensitive information
- **In-memory cache**: Recent logs kept in memory for quick access

**Usage Example:**
```typescript
import { errorLogger } from './services/errorLogger.service';

// Log an error
errorLogger.error('API call failed', error, { 
  component: 'UserList',
  action: 'fetchUsers' 
});

// Log a warning
errorLogger.warning('Slow API response', undefined, {
  component: 'Dashboard',
  action: 'loadData'
}, { responseTime: 5000 });

// Log info
errorLogger.info('User action', { 
  component: 'Settings',
  action: 'updateProfile' 
});
```

#### 2. API Error Handler Utility (`panel/src/utils/apiErrorHandler.ts`)

Provides utilities for wrapping API calls with automatic error logging.

**Features:**
- `withErrorLogging()` - Wrapper function for individual API calls
- `createApiService()` - Wraps entire service classes
- `setupGlobalErrorHandlers()` - Sets up global error handlers

**Usage Examples:**

**Wrap individual API calls:**
```typescript
import { withErrorLogging } from '../utils/apiErrorHandler';

async function fetchUsers() {
  return withErrorLogging(
    async () => {
      const response = await fetch('/api/users');
      return response.json();
    },
    {
      action: 'fetchUsers',
      component: 'UserService',
      metadata: { endpoint: '/api/users' }
    }
  );
}
```

**Wrap entire service:**
```typescript
import { createApiService } from '../utils/apiErrorHandler';

class UserService {
  async getUsers() { /* ... */ }
  async createUser(data) { /* ... */ }
}

export const userService = createApiService(
  new UserService(),
  'UserService'
);
```

**Setup global handlers (in main.tsx):**
```typescript
import { setupGlobalErrorHandlers } from './utils/apiErrorHandler';

setupGlobalErrorHandlers();
```

### Integration in Services

Example from `ticket.service.ts`:

```typescript
import { errorLogger } from './errorLogger.service';

class TicketService {
  async list(params): Promise<PaginatedTickets> {
    try {
      const url = `${API_BASE_URL}/api/tickets/admin/list?${query}`;
      const res = await this.fetchWithTimeout(url);
      return res.json();
    } catch (error) {
      errorLogger.error('Failed to list tickets', error as Error, { 
        action: 'list', 
        component: 'TicketService' 
      }, { params });
      throw error;
    }
  }
}
```

## Best Practices

### 1. Error Levels

- **INFO**: Informational messages (user actions, successful operations)
- **WARNING**: Potential issues that don't prevent operation (slow responses, deprecated features)
- **ERROR**: Errors that affect specific operations (API failures, validation errors)
- **CRITICAL**: Severe errors that affect system stability (database connection loss, unhandled exceptions)

### 2. Context Information

Always provide relevant context:
```typescript
errorLogger.error('Operation failed', error, req, {
  userId: user.id,
  operationType: 'create',
  resourceId: resource.id,
  attemptNumber: 3
});
```

### 3. Sensitive Data

The error logger automatically sanitizes common sensitive fields:
- password
- token
- authorization
- apiKey
- secret
- verificationCode
- otp
- creditCard
- cvv

### 4. Server-Side Integration

Add error logging to all try-catch blocks in controllers and services:

```typescript
try {
  // Operation
} catch (error) {
  errorLogger.error('Operation failed', error as Error, req, { 
    /* relevant context */ 
  });
  // Handle error response
}
```

### 5. Client-Side Integration

Add error logging to all API calls and critical operations:

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  errorLogger.error('API call failed', error as Error, {
    component: 'ComponentName',
    action: 'actionName'
  }, { /* additional metadata */ });
  throw error;
}
```

## Monitoring and Maintenance

### Viewing Logs

**Server logs:**
```bash
# View recent error logs
tail -f server/logs/error-$(date +%Y-%m-%d).log

# View all logs for today
cat server/logs/*-$(date +%Y-%m-%d).log
```

**Via API (admin only):**
```bash
# Get error logs
curl -H "Authorization: Bearer <token>" \
  "http://localhost:9000/api/error-logs?level=ERROR&limit=50"

# Get statistics
curl -H "Authorization: Bearer <token>" \
  "http://localhost:9000/api/error-logs/stats"
```

**Panel logs:**
Open browser console and use:
```javascript
// Get all stored logs
errorLogger.getAllStoredLogs()

// Get statistics
errorLogger.getStats()

// Clear logs
errorLogger.clearLogs()
```

### Log Rotation

Server logs automatically rotate when they exceed 10MB. Old log files are kept (up to 10 files per level).

### Extending the System

#### Add Email Alerts for Critical Errors

In `server/src/services/errorLoggerService.ts`:

```typescript
private handleCriticalError(entry: ErrorLogEntry): void {
  // Send email notification
  emailService.sendAlert({
    to: 'admin@example.com',
    subject: 'Critical Error Alert',
    body: JSON.stringify(entry, null, 2)
  });
  
  // Send Slack notification
  slackService.sendMessage({
    channel: '#alerts',
    text: `🚨 Critical Error: ${entry.message}`
  });
}
```

#### Add Custom Log Levels

Extend the `ErrorLevel` enum:

```typescript
export enum ErrorLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}
```

## Next Steps

1. **Set up monitoring dashboard**: Create a UI in the admin panel to view and analyze logs
2. **Add alerting**: Implement email/Slack notifications for critical errors
3. **Integrate with monitoring services**: Connect to services like Sentry, LogRocket, or DataDog
4. **Add performance monitoring**: Track API response times and slow operations
5. **Implement log aggregation**: For multi-server deployments, aggregate logs to a central location

## Troubleshooting

### Logs not being created

1. Check file permissions on the `server/logs/` directory
2. Ensure the directory exists (it's created automatically on first run)
3. Check disk space

### Logs not sent to server from panel

1. Verify the API endpoint is accessible
2. Check authentication token is valid
3. Ensure CORS is properly configured
4. Check browser console for network errors

### Performance impact

The error logging system is designed to be lightweight:
- Asynchronous file writes on server
- Automatic log rotation prevents disk space issues
- Client-side logs are batched and sent asynchronously
- Sensitive data sanitization is optimized

If you experience performance issues:
1. Reduce log retention period
2. Increase log rotation size threshold
3. Disable INFO level logging in production
4. Implement log sampling for high-traffic endpoints
