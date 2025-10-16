# How to Apply Error Logging to All APIs and Functions

This guide shows you how to systematically apply error logging to all remaining controllers, services, and functions in your application.

## 📋 Checklist

### Server Controllers to Update
- [ ] `authController.ts`
- [ ] `additionalInfoController.ts`
- [ ] `planController.ts`
- [ ] `referralController.ts`
- [ ] `logController.ts`
- [ ] `foodController.ts`
- [ ] `streakController.ts`
- [ ] `weightController.ts`
- [ ] `preferencesController.ts`
- [ ] `subscriptionPlanController.ts`
- [ ] `subscriptionController.ts`
- [ ] `offerController.ts`
- [ ] `userController.ts`
- [ ] `statisticsController.ts`
- [ ] `analyticsController.ts`
- [ ] `adminLogsController.ts`
- [ ] `appVersionController.ts`
- [ ] `notificationController.ts`
- [ ] `fcmController.ts`
- [x] `ticketController.ts` ✅ (Already done as example)

### Server Services to Update
- [ ] `cafeBazaarApiService.ts`
- [ ] `exerciseAnalysisService.ts`
- [ ] `firebaseService.ts`
- [ ] `foodAnalysisService.ts`
- [ ] `notificationService.ts`
- [ ] `purchaseVerificationService.ts`
- [ ] `smsService.ts`
- [ ] `streakService.ts`

### Panel Services to Update
- [ ] `analytics.service.ts`
- [ ] `appVersion.service.ts`
- [x] `auth.service.ts` ✅ (Already done as example)
- [ ] `logs.service.ts`
- [ ] `offer.service.ts`
- [ ] `statistics.service.ts`
- [ ] `subscription.service.ts`
- [ ] `subscriptionPlan.service.ts`
- [x] `ticket.service.ts` ✅ (Already done as example)
- [ ] `user.service.ts`

## 🔧 Step-by-Step Process

### For Server Controllers

1. **Import the error logger**
   ```typescript
   import errorLogger from '../services/errorLoggerService';
   ```

2. **Update each method's catch block**
   ```typescript
   // Before
   catch (error) {
     console.error('Error message:', error);
     res.status(500).json({ success: false, message: 'Internal server error' });
   }

   // After
   catch (error) {
     errorLogger.error('Descriptive error message', error as Error, req, {
       // Add relevant context
       userId: (req as any).user?.userId,
       resourceId: req.params.id,
       // Any other relevant metadata
     });
     res.status(500).json({ success: false, message: 'Internal server error' });
   }
   ```

3. **Add info logging for successful operations (optional)**
   ```typescript
   // After successful operation
   errorLogger.info('Resource created successfully', req, {
     resourceId: result.id,
     userId: user.id
   });
   ```

### For Server Services

1. **Import the error logger**
   ```typescript
   import errorLogger from './errorLoggerService';
   // OR use the helper
   import { logServiceError } from '../utils/errorLogger';
   ```

2. **Update catch blocks**
   ```typescript
   // Before
   catch (error) {
     console.error('Service error:', error);
     throw error;
   }

   // After
   catch (error) {
     logServiceError('ServiceName', 'methodName', error, {
       // Add relevant context
       param1: value1,
       param2: value2
     });
     throw error;
   }
   ```

### For Panel Services

1. **Import the error logger**
   ```typescript
   import { errorLogger } from './errorLogger.service';
   ```

2. **Wrap methods with try-catch**
   ```typescript
   async methodName(params: any): Promise<Result> {
     try {
       const url = `${API_BASE_URL}/api/endpoint`;
       const res = await this.fetchWithTimeout(url);
       return res.json();
     } catch (error) {
       errorLogger.error('Descriptive error message', error as Error, {
         component: 'ServiceName',
         action: 'methodName'
       }, { params });
       throw error;
     }
   }
   ```

3. **Update fetchWithTimeout error handling**
   ```typescript
   private async fetchWithTimeout(url: string, options: RequestInit = {}) {
     const controller = new AbortController();
     const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

     try {
       // ... fetch logic
       clearTimeout(timeout);
       return response;
     } catch (error) {
       clearTimeout(timeout);
       errorLogger.error('Fetch timeout error', error as Error, {
         action: 'fetchWithTimeout',
         component: 'ServiceName',
         url
       });
       throw error;
     }
   }
   ```

## 🎯 Automation Script

You can use this bash script to help identify files that need updating:

```bash
#!/bin/bash

echo "=== Server Controllers without errorLogger ==="
grep -L "errorLogger" server/src/controllers/*.ts | grep -v "errorLogController"

echo ""
echo "=== Server Services without errorLogger ==="
grep -L "errorLogger" server/src/services/*.ts | grep -v "errorLoggerService"

echo ""
echo "=== Panel Services without errorLogger ==="
grep -L "errorLogger" panel/src/services/*.ts | grep -v "errorLogger.service"

echo ""
echo "=== Files still using console.error ==="
echo "Server Controllers:"
grep -l "console.error" server/src/controllers/*.ts

echo ""
echo "Server Services:"
grep -l "console.error" server/src/services/*.ts

echo ""
echo "Panel Services:"
grep -l "console.error" panel/src/services/*.ts
```

Save this as `check-error-logging.sh` and run:
```bash
chmod +x check-error-logging.sh
./check-error-logging.sh
```

## 📝 Template for Controllers

```typescript
import { Request, Response } from 'express';
import errorLogger from '../services/errorLoggerService';
// ... other imports

export class YourController {
  async methodName(req: Request, res: Response): Promise<void> {
    try {
      // Your existing logic here
      const result = await someOperation();
      
      // Optional: Log successful operations
      errorLogger.info('Operation completed successfully', req, {
        userId: (req as any).user?.userId,
        resultId: result.id
      });

      res.json({ success: true, data: result });
    } catch (error) {
      errorLogger.error('Operation failed', error as Error, req, {
        userId: (req as any).user?.userId,
        // Add any relevant context from req.body, req.params, etc.
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
}
```

## 📝 Template for Services

```typescript
import { logServiceError, logInfo } from '../utils/errorLogger';
// ... other imports

export class YourService {
  async methodName(params: any): Promise<Result> {
    try {
      // Your existing logic here
      const result = await someOperation(params);
      
      // Optional: Log successful operations
      logInfo('Service operation completed', undefined, {
        service: 'YourService',
        method: 'methodName',
        resultId: result.id
      });

      return result;
    } catch (error) {
      logServiceError('YourService', 'methodName', error, {
        params,
        // Add any relevant context
      });
      throw error;
    }
  }
}
```

## 📝 Template for Panel Services

```typescript
import { errorLogger } from './errorLogger.service';
// ... other imports

class YourService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const token = authService.getToken();
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          ...options.headers,
        },
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      errorLogger.error('Fetch timeout error', error as Error, {
        action: 'fetchWithTimeout',
        component: 'YourService',
        url
      });
      throw error;
    }
  }

  async methodName(params: any): Promise<Result> {
    try {
      const url = `${API_BASE_URL}/api/endpoint`;
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return res.json();
    } catch (error) {
      errorLogger.error('Method failed', error as Error, {
        component: 'YourService',
        action: 'methodName'
      }, { params });
      throw error;
    }
  }
}

export const yourService = new YourService();
```

## 🔍 Testing Your Implementation

After adding error logging to a file:

1. **Test error scenarios**
   - Trigger errors intentionally
   - Verify logs are created in `server/logs/`
   - Check log format and content

2. **Test successful operations**
   - Verify INFO logs are created (if added)
   - Check context is captured correctly

3. **Test API endpoints**
   ```bash
   # View logs via API
   curl -H "Authorization: Bearer <token>" \
     "http://localhost:9000/api/error-logs?level=ERROR&limit=10"
   ```

4. **Check browser console (Panel)**
   - Verify errors are logged to console in development
   - Check localStorage for stored logs
   - Verify logs are sent to server for ERROR/CRITICAL levels

## 💡 Tips

1. **Be descriptive with error messages**
   - ❌ Bad: `"Error occurred"`
   - ✅ Good: `"Failed to create user account"`

2. **Include relevant context**
   - User IDs, resource IDs, operation parameters
   - Don't include sensitive data (auto-sanitized anyway)

3. **Use appropriate log levels**
   - INFO: Successful operations, user actions
   - WARNING: Recoverable issues, deprecations
   - ERROR: Operation failures
   - CRITICAL: System failures

4. **Don't over-log**
   - Avoid logging in tight loops
   - Don't log expected validation errors as ERROR
   - Use WARNING for expected but notable conditions

5. **Test as you go**
   - Update one file at a time
   - Test before moving to the next
   - Verify logs are created correctly

## 📊 Progress Tracking

Create a simple tracking file:

```bash
# Create progress tracker
cat > error-logging-progress.txt << 'EOF'
# Error Logging Implementation Progress

## Server Controllers
- [ ] authController.ts
- [ ] additionalInfoController.ts
... (add all files)

## Server Services
- [ ] cafeBazaarApiService.ts
... (add all files)

## Panel Services
- [ ] analytics.service.ts
... (add all files)

Last updated: [DATE]
EOF
```

Update this file as you complete each file.

## 🎉 When Complete

Once all files are updated:

1. Run the check script to verify all files have error logging
2. Test critical paths in the application
3. Monitor logs for a few days to ensure proper operation
4. Consider adding a log viewing UI in the admin panel
5. Set up alerts for CRITICAL errors

## 📚 References

- Full documentation: `ERROR_LOGGING_GUIDE.md`
- Quick reference: `ERROR_LOGGING_QUICK_REFERENCE.md`
- Implementation summary: `ERROR_LOGGING_IMPLEMENTATION.md`
- Example integrations:
  - `server/src/controllers/ticketController.ts`
  - `panel/src/services/auth.service.ts`
  - `panel/src/services/ticket.service.ts`
