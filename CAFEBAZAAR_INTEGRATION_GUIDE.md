# راهنمای پیاده‌سازی پرداخت CafeBazaar با Flutter Poolakey

## 🎯 خلاصه تغییرات

کتابخانه پرداخت با استفاده از **flutter_poolakey** نسخه 2.2.0 پیاده‌سازی شده است.

### فایل‌های تغییر یافته:

#### 1. Frontend (Flutter)
- ✅ `pubspec.yaml` - افزودن `flutter_poolakey: ^2.2.0+1.0.0`
- ✅ `lib/services/payment_service.dart` - سرویس پرداخت کامل با API رسمی
- ✅ `lib/features/subscription/pages/subscription_page.dart` - یکپارچه‌سازی پرداخت
- ✅ `lib/features/login/data/datasources/secure_storage.dart` - ذخیره‌سازی وضعیت اشتراک
- ✅ `lib/config/api_config.dart` - اضافه کردن endpoint های subscription
- ✅ `assets/translations/en-US.json` - ترجمه انگلیسی
- ✅ `assets/translations/fa-IR.json` - ترجمه فارسی

#### 2. Backend (Node.js)
- ✅ `server/src/models/Subscription.ts` - مدل دیتابیس
- ✅ `server/src/controllers/subscriptionController.ts` - کنترلر API
- ✅ `server/src/routes/subscriptionRoutes.ts` - مسیرهای API
- ✅ `server/src/index.ts` - ثبت مسیرهای جدید

## 📝 API استفاده شده از Poolakey

### 1. اتصال به بازار
```dart
await FlutterPoolakey.init(
  rsaPublicKey,
  onDisconnected: () {
    // Handle disconnection
  },
);
```

### 2. خرید اشتراک
```dart
PurchaseInfo purchaseInfo = await FlutterPoolakey.subscribe(
  productId,
  payload: 'optional_payload',
);
```

### 3. خرید محصول معمولی
```dart
PurchaseInfo purchaseInfo = await FlutterPoolakey.purchase(
  productId,
  payload: 'optional_payload',
);
```

### 4. مصرف کردن خرید
```dart
await FlutterPoolakey.consume(purchaseToken);
```

### 5. دریافت جزئیات محصولات اشتراکی
```dart
List<SkuDetails> details = await FlutterPoolakey.getSubscriptionSkuDetails([
  'product_id_1',
  'product_id_2',
]);
```

### 6. دریافت جزئیات محصولات معمولی
```dart
List<SkuDetails> details = await FlutterPoolakey.getInAppSkuDetails([
  'product_id_1',
  'product_id_2',
]);
```

### 7. دریافت خریدهای کاربر
```dart
List<PurchaseInfo> purchases = await FlutterPoolakey.getAllPurchasedProducts();
```

### 8. دریافت اشتراک‌های کاربر
```dart
List<PurchaseInfo> subscriptions = await FlutterPoolakey.getAllSubscribedProducts();
```

## 🔑 مراحل راه‌اندازی

### 1. دریافت کلید RSA از پیشخان بازار

1. به [پیشخان توسعه‌دهندگان بازار](https://pishkhan.cafebazaar.ir/) وارد شوید
2. برنامه خود را انتخاب کنید
3. به بخش "پرداخت درون برنامه‌ای" بروید
4. کلید RSA Public را کپی کنید
5. در فایل `lib/services/payment_service.dart` جایگزین کنید:

```dart
static const String _rsaPublicKey = 'YOUR_RSA_PUBLIC_KEY_HERE';
```

### 2. افزودن Permission به AndroidManifest

فایل: `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- اضافه کردن این permission -->
    <uses-permission android:name="com.farsitel.bazaar.permission.PAY_THROUGH_BAZAAR" />
    
    <application>
        <!-- تنظیمات برنامه شما -->
    </application>
</manifest>
```

### 3. ساخت محصولات در پیشخان بازار

1. به پیشخان بازار بروید
2. در بخش "پرداخت درون برنامه‌ای":
   - یک محصول اشتراک ماهانه بسازید (مثلاً: `monthly_premium`)
   - یک محصول اشتراک سالانه بسازید (مثلاً: `yearly_premium`)
3. قیمت و دوره‌ی تکرار را تنظیم کنید
4. محصولات را فعال کنید

### 4. به‌روزرسانی Product Keys در دیتابیس

```javascript
// با استفاده از MongoDB یا admin panel

// به‌روزرسانی پلن ماهانه
db.subscriptionplans.updateOne(
  { duration: 'monthly' },
  { $set: { cafebazaarProductKey: 'monthly_premium' } }
)

// به‌روزرسانی پلن سالانه
db.subscriptionplans.updateOne(
  { duration: 'yearly' },
  { $set: { cafebazaarProductKey: 'yearly_premium' } }
)
```

### 5. نصب dependencies

```bash
cd /Users/erfan/repositories/cal_ai
flutter pub get
```

### 6. راه‌اندازی سرور

```bash
cd server
npm install  # اگر هنوز نصب نکرده‌اید
npm run dev
```

## 🧪 تست کردن

### حالت Sandbox

1. در پیشخان بازار، حالت sandbox را فعال کنید
2. از حساب‌های تست استفاده کنید
3. هیچ پول واقعی کسر نمی‌شود

### اجرای برنامه

```bash
flutter run
```

### جریان تست:

1. به صفحه اشتراک بروید
2. یک پلن (ماهانه یا سالانه) انتخاب کنید
3. روی دکمه "ادامه" کلیک کنید
4. پرداخت را در دیالوگ بازار تکمیل کنید
5. پیام موفقیت را ببینید

## 🔐 امنیت

### نکات مهم:

1. **محافظت از کلید RSA**
   - هرگز کلید واقعی را commit نکنید
   - از environment variables استفاده کنید
   - در production از کلید مخفی استفاده کنید

2. **تأیید خرید در Backend**
   - همیشه خرید را در backend تأیید کنید
   - به تأیید client-side اعتماد نکنید
   - Token های خرید را validate کنید

3. **جلوگیری از تقلب**
   - از token های یکتا استفاده کنید
   - خریدهای تکراری را چک کنید
   - همه تلاش‌های خرید را log کنید

## 📊 جریان کامل پرداخت

```
[کاربر] -> [انتخاب پلن]
           ↓
[فشردن دکمه "ادامه"]
           ↓
[FlutterPoolakey.subscribe()] -> [دیالوگ بازار]
           ↓
[کاربر پرداخت می‌کند]
           ↓
[PurchaseInfo برگشت داده می‌شود]
           ↓
[تأیید با Backend] -> [POST /api/subscription/verify-purchase]
           ↓
[ذخیره در دیتابیس]
           ↓
[فعال‌سازی اشتراک]
           ↓
[ذخیره local در SecureStorage]
           ↓
[نمایش پیام موفقیت]
```

## 🌟 ویژگی‌های پیاده‌سازی شده

### پرداخت:
- ✅ خرید اشتراک ماهانه
- ✅ خرید اشتراک سالانه
- ✅ خرید محصولات معمولی
- ✅ مصرف کردن خریدها
- ✅ دریافت جزئیات محصولات
- ✅ دریافت لیست خریدهای کاربر

### مدیریت خطا:
- ✅ خطاهای شبکه
- ✅ محصول یافت نشد
- ✅ سرویس پرداخت در دسترس نیست
- ✅ لغو توسط کاربر
- ✅ محصول قبلاً خریداری شده
- ✅ همه پیام‌ها به فارسی و انگلیسی

### امنیت:
- ✅ تأیید خرید در backend
- ✅ اعتبارسنجی token
- ✅ جلوگیری از استفاده مجدد token
- ✅ endpoint های احراز هویت شده
- ✅ ذخیره‌سازی امن local

## 📱 نمونه استفاده

### بررسی وضعیت اشتراک:
```dart
final paymentService = ref.read(paymentServiceProvider);
final status = await paymentService.checkSubscriptionStatus();

if (status.isActive) {
  print('کاربر اشتراک ${status.planType} فعال دارد');
  print('تاریخ انقضا: ${status.expiryDate}');
}
```

### خرید اشتراک:
```dart
final result = await paymentService.purchaseSubscription(productKey);

if (result.success) {
  print('اشتراک فعال شد!');
  print('Purchase Token: ${result.purchaseToken}');
  print('Order ID: ${result.orderId}');
} else {
  print('خطا: ${result.message}');
}
```

### دریافت اشتراک‌های فعال:
```dart
final subscriptions = await paymentService.getAllSubscribedProducts();

for (var sub in subscriptions) {
  print('محصول: ${sub.productId}');
  print('Token: ${sub.purchaseToken}');
  print('Order ID: ${sub.orderId}');
}
```

## 🔄 API Backend

### تأیید خرید
```http
POST /api/subscription/verify-purchase
Authorization: Bearer {token}

{
  "productKey": "yearly_premium",
  "purchaseToken": "token_from_cafebazaar",
  "orderId": "order_id",
  "payload": "optional_payload"
}
```

### بررسی وضعیت
```http
GET /api/subscription/status
Authorization: Bearer {token}
```

### لغو اشتراک
```http
POST /api/subscription/cancel
Authorization: Bearer {token}
```

### تاریخچه خریدها
```http
GET /api/subscription/history
Authorization: Bearer {token}
```

## ⚠️ نکات مهم

1. **Poolakey فقط Android**: این کتابخانه فقط برای Android است
2. **نیاز به بازار**: برنامه بازار باید روی دستگاه نصب باشد
3. **اتصال اینترنت**: برای پرداخت نیاز به اینترنت است
4. **تأیید Backend**: همیشه خریدها را در backend تأیید کنید
5. **Subscriptions قابل مصرف نیستند**: فقط محصولات معمولی consume می‌شوند

## 📚 منابع

- [مستندات Flutter Poolakey](https://github.com/cafebazaar/flutter_poolakey)
- [راهنمای توسعه‌دهندگان بازار](https://developers.cafebazaar.ir/)
- [پیشخان بازار](https://pishkhan.cafebazaar.ir/)

## ✅ Checklist تست

قبل از انتشار production:
- [ ] نصب `flutter pub get`
- [ ] افزودن permission به AndroidManifest
- [ ] جایگزینی کلید RSA واقعی
- [ ] ساخت محصولات در پیشخان بازار
- [ ] به‌روزرسانی product keys در دیتابیس
- [ ] تست پرداخت در حالت sandbox
- [ ] تست تأیید خرید
- [ ] تست مدیریت خطاها
- [ ] تست بررسی وضعیت اشتراک
- [ ] تست لغو اشتراک
- [ ] تست روی دستگاه واقعی
- [ ] بررسی log های backend
- [ ] تست با چند کاربر مختلف

## 🎉 آماده است!

پیاده‌سازی پرداخت CafeBazaar با Poolakey کامل شده و آماده تست است! 🚀

موفق باشید! 💪

