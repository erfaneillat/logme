import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../services/api_service_provider.dart';
import '../../../config/api_config.dart';
import 'food_detail_page.dart' show IngredientItem;

class FixResultArgs {
  final String? id;
  final String dateIso;
  final String title;
  final String? imageUrl;
  final int calories;
  final int proteinGrams;
  final int fatGrams;
  final int carbsGrams;
  final int healthScore;
  final double portions;
  final List<IngredientItem> ingredients;

  const FixResultArgs({
    this.id,
    required this.dateIso,
    required this.title,
    required this.calories,
    required this.proteinGrams,
    required this.fatGrams,
    required this.carbsGrams,
    this.healthScore = 0,
    this.portions = 1.0,
    this.imageUrl,
    this.ingredients = const [],
  });
}


class FixResultPage extends HookConsumerWidget {
  final FixResultArgs args;
  
  const FixResultPage({super.key, required this.args});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final textController = useTextEditingController();
    final isLoading = useState<bool>(false);

    Future<void> _fixResult() async {
      if (textController.text.trim().isEmpty) return;

      isLoading.value = true;
      
      try {
        final apiService = ref.read(apiServiceProvider);
        
        // Prepare the data to send to the server
        final requestData = {
          'originalData': {
            'title': args.title,
            'calories': args.calories,
            'proteinGrams': args.proteinGrams,
            'fatGrams': args.fatGrams,
            'carbsGrams': args.carbsGrams,
            'healthScore': args.healthScore,
            'portions': args.portions,
            'ingredients': args.ingredients.map((e) => e.toJson()).toList(),
            'imageUrl': args.imageUrl,
          },
          'userDescription': textController.text.trim(),
        };

        final fixedData = await apiService.post(ApiConfig.foodFixResult, data: requestData);
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('fix_result.fixed'.tr())),
          );
          
          // Navigate back to food detail page with fixed data
          context.pop(fixedData);
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())),
          );
        }
      } finally {
        isLoading.value = false;
      }
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back, color: Colors.black),
        ),
        title: Text(
          'fix_result.title'.tr(),
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            
            // Input field
            Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TextField(
                controller: textController,
                maxLines: 8,
                decoration: InputDecoration(
                  hintText: 'fix_result.placeholder'.tr(),
                  hintStyle: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 16,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(16),
                ),
                style: const TextStyle(
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Description text
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'fix_result.description'.tr(),
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
            ),
            
            const Spacer(),
            
            // Fix button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading.value ? null : _fixResult,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (isLoading.value) ...[
                      const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'fix_result.fixing'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ] else ...[
                      const Icon(Icons.auto_fix_high, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'fix_result.fix_button'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
