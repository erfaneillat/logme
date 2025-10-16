# Error Logging - Quick Reference Card

## 🎯 Server (Node.js/Express)

### Import
```typescript
import errorLogger from '../services/errorLoggerService';
// OR use helpers
import { logServiceError, logWarning, logInfo } from '../utils/errorLogger';
```

### Basic Usage in Controllers
```typescript
try {
  // Your code
  const result = await someOperation();
  res.json({ success: true, data: result });
} catch (error) {
  errorLogger.error('Operation failed', error as Error, req, { 
    userId: user.id 
  });
  res.status(500).json({ success: false, message: 'Internal server error' });
}
```

### Log Levels
```typescript
// INFO - Informational messages
errorLogger.info('User logged in', req, { userId: '123' });

// WARNING - Potential issues
errorLogger.warning('Rate limit approaching', undefined, req);

// ERROR - Operation failures
errorLogger.error('Database query failed', error, req, { query: 'SELECT...' });

// CRITICAL - System-level failures
errorLogger.critical('Database connection lost', error, req);
```

### Service-Level Logging (No Request Object)
```typescript
import { logServiceError } from '../utils/errorLogger';

try {
  // Service operation
} catch (error) {
  logServiceError('UserService', 'createUser', error, { userId: '123' });
  throw error;
}
```

---

## 🎨 Panel (React/TypeScript)

### Import
```typescript
import { errorLogger } from './services/errorLogger.service';
```

### Basic Usage in Services
```typescript
try {
  const response = await fetch(url);
  return await response.json();
} catch (error) {
  errorLogger.error('API call failed', error as Error, {
    component: 'UserService',
    action: 'fetchUsers'
  }, { endpoint: url });
  throw error;
}
```

### Log Levels
```typescript
// INFO
errorLogger.info('User action', { 
  component: 'Settings',
  action: 'updateProfile' 
});

// WARNING
errorLogger.warning('Slow response', undefined, {
  component: 'Dashboard',
  action: 'loadData'
}, { responseTime: 5000 });

// ERROR
errorLogger.error('API failed', error, {
  component: 'UserList',
  action: 'fetchUsers'
});

// CRITICAL
errorLogger.critical('App crashed', error, {
  component: 'App',
  action: 'render'
});
```

### Global Error Handlers
In `main.tsx`:
```typescript
import { setupGlobalErrorHandlers } from './utils/apiErrorHandler';

setupGlobalErrorHandlers();
```

### Wrap API Calls
```typescript
import { withErrorLogging } from '../utils/apiErrorHandler';

const result = await withErrorLogging(
  async () => {
    return await fetch('/api/users').then(r => r.json());
  },
  {
    action: 'fetchUsers',
    component: 'UserService'
  }
);
```

---

## 📊 API Endpoints (Admin Only)

### Get Logs
```bash
GET /api/error-logs?level=ERROR&date=2024-01-15&limit=100
```

### Get Statistics
```bash
GET /api/error-logs/stats?date=2024-01-15
```

### Create Log Entry
```bash
POST /api/error-logs
{
  "level": "ERROR",
  "message": "Test error",
  "metadata": { "key": "value" }
}
```

---

## 🔍 Viewing Logs

### Server Logs (File System)
```bash
# View today's errors
tail -f server/logs/error-$(date +%Y-%m-%d).log

# View all today's logs
cat server/logs/*-$(date +%Y-%m-%d).log | jq

# Count errors by level
grep -h "ERROR" server/logs/*.log | wc -l
```

### Panel Logs (Browser Console)
```javascript
// Get all logs
errorLogger.getAllStoredLogs()

// Get statistics
errorLogger.getStats()

// Clear logs
errorLogger.clearLogs()
```

---

## ⚡ Quick Tips

### 1. Always Include Context
```typescript
// ❌ Bad
errorLogger.error('Error occurred', error, req);

// ✅ Good
errorLogger.error('Failed to create user', error, req, {
  userId: user.id,
  operation: 'create',
  attemptNumber: 3
});
```

### 2. Use Appropriate Log Levels
- **INFO**: Success, user actions
- **WARNING**: Recoverable issues, deprecations
- **ERROR**: Operation failures
- **CRITICAL**: System failures, unhandled exceptions

### 3. Don't Log Sensitive Data
The system auto-sanitizes these fields:
- password, token, authorization
- apiKey, secret, verificationCode
- otp, creditCard, cvv

### 4. Log Before Throwing
```typescript
try {
  await operation();
} catch (error) {
  errorLogger.error('Operation failed', error, req);
  throw error; // Re-throw after logging
}
```

### 5. Use Metadata for Context
```typescript
errorLogger.error('Query failed', error, req, {
  query: sql,
  params: queryParams,
  duration: executionTime,
  retryCount: 3
});
```

---

## 📁 File Structure

```
server/
├── src/
│   ├── services/
│   │   └── errorLoggerService.ts      # Core service
│   ├── controllers/
│   │   └── errorLogController.ts      # API endpoints
│   ├── routes/
│   │   └── errorLogRoutes.ts          # Routes
│   ├── middleware/
│   │   └── errorHandler.ts            # Enhanced middleware
│   └── utils/
│       └── errorLogger.ts              # Helper utilities
└── logs/                                # Log files (gitignored)
    ├── error-2024-01-15.log
    ├── warning-2024-01-15.log
    └── ...

panel/
└── src/
    ├── services/
    │   └── errorLogger.service.ts      # Client-side service
    └── utils/
        └── apiErrorHandler.ts          # Helper utilities
```

---

## 🚀 Common Patterns

### Pattern 1: Controller Method
```typescript
async create(req: Request, res: Response): Promise<void> {
  try {
    const result = await this.service.create(req.body);
    errorLogger.info('Resource created', req, { id: result.id });
    res.json({ success: true, data: result });
  } catch (error) {
    errorLogger.error('Failed to create resource', error as Error, req, {
      body: req.body
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
```

### Pattern 2: Service Method
```typescript
async fetchData(url: string): Promise<Data> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    errorLogger.error('Fetch failed', error as Error, {
      component: 'DataService',
      action: 'fetchData'
    }, { url });
    throw error;
  }
}
```

### Pattern 3: Async Operation with Retry
```typescript
async operationWithRetry(data: any, maxRetries = 3): Promise<Result> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.performOperation(data);
    } catch (error) {
      if (attempt === maxRetries) {
        errorLogger.error('Operation failed after retries', error as Error, req, {
          attempts: maxRetries,
          data
        });
        throw error;
      }
      errorLogger.warning('Operation failed, retrying', error as Error, req, {
        attempt,
        maxRetries
      });
    }
  }
}
```

---

## 📚 Full Documentation

See `ERROR_LOGGING_GUIDE.md` for complete documentation.
