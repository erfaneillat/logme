# 🚀 راهنمای سریع راه‌اندازی پرداخت CafeBazaar

## ⚡ مراحل کوتاه برای شروع

### 1️⃣ نصب dependencies
```bash
cd /Users/erfan/repositories/cal_ai
flutter pub get
```

### 2️⃣ دریافت کلید RSA
1. به https://pishkhan.cafebazaar.ir/ بروید
2. برنامه را انتخاب کنید
3. بخش "پرداخت درون برنامه‌ای" → کپی کلید RSA
4. در `lib/services/payment_service.dart` جایگزین کنید (خط ۱۸):
```dart
static const String _rsaPublicKey = 'YOUR_ACTUAL_KEY_HERE';
```

### 3️⃣ افزودن Permission
فایل: `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="com.farsitel.bazaar.permission.PAY_THROUGH_BAZAAR" />
```

### 4️⃣ ساخت محصولات در بازار
- محصول ماهانه: مثلاً `monthly_premium`
- محصول سالانه: مثلاً `yearly_premium`

### 5️⃣ به‌روزرسانی product keys در دیتابیس
```javascript
db.subscriptionplans.updateOne(
  { duration: 'monthly' },
  { $set: { cafebazaarProductKey: 'monthly_premium' } }
)

db.subscriptionplans.updateOne(
  { duration: 'yearly' },
  { $set: { cafebazaarProductKey: 'yearly_premium' } }
)
```

### 6️⃣ اجرا
```bash
# Backend
cd server && npm run dev

# Flutter app
flutter run
```

## ✅ تست
1. به صفحه subscription بروید
2. یک پلن انتخاب کنید
3. دکمه ادامه را بزنید
4. پرداخت را کامل کنید

## 📚 مستندات کامل
برای جزئیات بیشتر:
- `CAFEBAZAAR_INTEGRATION_GUIDE.md` - راهنمای کامل به فارسی
- `CAFEBAZAAR_PAYMENT_IMPLEMENTATION.md` - مستندات تکنیکال انگلیسی

## 🆘 مشکل دارید?
نگاه کنید به بخش Troubleshooting در `CAFEBAZAAR_INTEGRATION_GUIDE.md`

