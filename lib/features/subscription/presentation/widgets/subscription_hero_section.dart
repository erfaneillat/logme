import 'dart:async';
import 'package:cal_ai/config/api_config.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class SubscriptionHeroSection extends HookWidget {
  const SubscriptionHeroSection({
    super.key,
    required this.currentTestimonial,
    required this.state,
  });

  final ValueNotifier<int> currentTestimonial;
  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    // Define testimonials directly in code for reliability
    final testimonials = [
      {
        'name': 'مونا',
        'text':
            'فقط با عکس گرفتن از غذاهام، ۱۵ کیلو کم کردم! یکی از بهترین اتفاقات زندگیم. مررررسی لقمه.',
        'image': 'assets/images/comments/mona.jpg',
      },
      {
        'name': 'نیلوفر',
        'text':
            'همیشه یادم می‌رفت غذاهام رو وارد کنم و رژیمم نصفه می‌موند. ولی با لقمه همه‌چی خودکار انجام می‌شه. فقط عکس می‌گیرم و پیشرفتم رو هر روز می‌بینم، همین باعث شده ادامه بدم.',
        'image': 'assets/images/comments/niloofar.jpg',
      },
      {
        'name': 'نیما',
        'text':
            'بعد از یه ماه استفاده از لقمه، دیدن پیشرفتم روی نمودار واقعاً خوشحالم کرد. اینکه بتونی مسیرت رو ببینی، خودش بزرگ‌ترین انگیزه‌ست.',
        'image': 'assets/images/comments/nima.jpg',
      },
      {
        'name': 'پدرام',
        'text':
            'بهترین بخش لقمه برای من نمودار پیشرفته‌ست. می‌فهمم دقیقاً توی هفته چند درصد به هدف وزنیم نزدیک‌تر شدم.',
        'image': 'assets/images/comments/pedram.jpg',
      },
      {
        'name': 'رامین',
        'text':
            'احساس می‌کنم یه مربی کوچیک توی جیبمه! هر بار یه غذای جدید می‌خورم، لقمه آنالیزش می‌کنه و راهنمایی می‌ده چطور متعادل‌تر بخورم.',
        'image': 'assets/images/comments/ramin.jpg',
      },
      {
        'name': 'الناز',
        'text':
            'اینکه غذاهای ایرانی رو میشناسه فوق العاده س، لقمه حتی خورشت و برنج رو هم درست تشخیص داد 😅 خیلی دقیق و کاربردیه.',
        'image': 'assets/images/comments/elnaz.jpg',
      },
      {
        'name': 'میترا',
        'text':
            'همیشه دنبال یه راه ساده بودم که بفهمم چی می‌خورم بدون محاسبه و سرچ کردن. لقمه دقیقاً همونه. حس می‌کنم بالاخره یه اپ طراحی شده برای آدمای واقعی!',
        'image': 'assets/images/comments/mitra.jpg',
      },
    ];

    final pageController = usePageController(initialPage: 0);
    final isUserInteracting = useState(false);

    // Auto-rotate testimonials every 5 seconds, but pause when user is interacting
    useEffect(() {
      final timer = Timer.periodic(const Duration(seconds: 5), (timer) {
        if (!isUserInteracting.value && pageController.hasClients) {
          final nextPage = (currentTestimonial.value + 1) % testimonials.length;
          currentTestimonial.value = nextPage;
          pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
          );
        }
      });
      return timer.cancel;
    }, []);

    String? planImageUrl;
    if (state.yearlyImageUrl != null) {
      planImageUrl = '${ApiConfig.baseUrl}${state.yearlyImageUrl}';
    } else if (state.threeMonthImageUrl != null) {
      planImageUrl = '${ApiConfig.baseUrl}${state.threeMonthImageUrl}';
    } else if (state.monthlyImageUrl != null) {
      planImageUrl = '${ApiConfig.baseUrl}${state.monthlyImageUrl}';
    }

    // Show loading or empty state if testimonials not loaded yet
    if (testimonials.isEmpty) {
      return Container(
        padding: const EdgeInsets.only(left: 20, right: 20, bottom: 5, top: 5),
        color: Colors.white,
        child: Column(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.network(
                planImageUrl ??
                    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
                height: 200,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child:
                        const Icon(Icons.image, size: 50, color: Colors.grey),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 5, top: 5),
      color: Colors.white,
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.network(
              planImageUrl ??
                  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.image, size: 50, color: Colors.grey),
                );
              },
            ),
          ),
          const SizedBox(height: 20),
          // Testimonial Slider
          Container(
            color: Colors.white,
            height: 180, // Fixed height for testimonial content
            child: PageView.builder(
              controller: pageController,
              itemCount: testimonials.length,
              onPageChanged: (page) {
                currentTestimonial.value = page;
                isUserInteracting.value = true;
                // Reset user interaction flag after 3 seconds
                Future.delayed(const Duration(seconds: 3), () {
                  if (isUserInteracting.value) {
                    isUserInteracting.value = false;
                  }
                });
              },
              itemBuilder: (context, index) {
                final testimonial = testimonials[index];
                return Container(
                  margin:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 5),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 15,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          CircleAvatar(
                            radius: 25,
                            backgroundColor: const Color(0xFF4CAF50),
                            backgroundImage: AssetImage(
                              testimonial['image']!,
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  testimonial['name']!,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF1A1A1A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            children: List.generate(
                              5,
                              (index) => const Icon(
                                Icons.star,
                                color: Color(0xFFFF9800),
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: SingleChildScrollView(
                          child: Text(
                            testimonial['text']!,
                            style: const TextStyle(
                              color: Color(0xFF666666),
                              fontSize: 13,
                              height: 1.8,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              testimonials.length,
              (index) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: index == currentTestimonial.value ? 25 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: index == currentTestimonial.value
                      ? const Color(0xFF1A1A1A)
                      : const Color(0xFFDDDDDD),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
