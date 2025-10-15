import 'package:cal_ai/config/api_config.dart';
import 'package:cal_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:flutter/material.dart';

class SubscriptionHeroSection extends StatelessWidget {
  const SubscriptionHeroSection({
    super.key,
    required this.currentTestimonial,
    required this.state,
  });

  final ValueNotifier<int> currentTestimonial;
  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    final testimonials = [
      {
        'name': 'Jake Sullivan',
        'text':
            '۱۵ پوند در ۲ ماه کاهش وزن داشتم! می‌خواستم از اوزمپیک استفاده کنم اما تصمیم گرفتم به این برنامه فرصت بدهم و جواب داد :)',
        'image':
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
    ];

    String? planImageUrl;
    if (state.yearlyImageUrl != null) {
      planImageUrl = '${ApiConfig.baseUrl}${state.yearlyImageUrl}';
    } else if (state.threeMonthImageUrl != null) {
      planImageUrl = '${ApiConfig.baseUrl}${state.threeMonthImageUrl}';
    } else if (state.monthlyImageUrl != null) {
      planImageUrl = '${ApiConfig.baseUrl}${state.monthlyImageUrl}';
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
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 15,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 25,
                      backgroundColor: const Color(0xFF4CAF50),
                      backgroundImage: NetworkImage(
                        testimonials[currentTestimonial.value]['image'] as String,
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            testimonials[currentTestimonial.value]['name']
                                as String,
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
                const SizedBox(height: 15),
                Text(
                  testimonials[currentTestimonial.value]['text'] as String,
                  style: const TextStyle(
                    color: Color(0xFF666666),
                    fontSize: 15,
                    height: 1.8,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              7,
              (index) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: index == 0 ? 25 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: index == 0
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
