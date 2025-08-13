import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../services/api_service_provider.dart';
import '../config/api_config.dart';

class ConnectionTestWidget extends HookConsumerWidget {
  const ConnectionTestWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isConnected = useState<bool?>(null);
    final isLoading = useState(false);
    final apiService = ref.read(apiServiceProvider);

    Future<void> testConnection() async {
      isLoading.value = true;
      isConnected.value = null;

      try {
        final connected = await apiService.testConnection();
        isConnected.value = connected;
      } catch (e) {
        isConnected.value = false;
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Connection test failed: $e')),
          );
        }
      } finally {
        isLoading.value = false;
      }
    }

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '🔗 API Connection Test',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Base URL: ${ApiConfig.baseUrl}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                ElevatedButton(
                  onPressed: isLoading.value ? null : testConnection,
                  child: isLoading.value
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Test Connection'),
                ),
                const SizedBox(width: 16),
                if (isConnected.value != null)
                  Icon(
                    isConnected.value! ? Icons.check_circle : Icons.error,
                    color: isConnected.value! ? Colors.green : Colors.red,
                    size: 24,
                  ),
              ],
            ),
            if (isConnected.value != null) ...[
              const SizedBox(height: 8),
              Text(
                isConnected.value!
                    ? '✅ Connected successfully!'
                    : '❌ Connection failed. Check server and network.',
                style: TextStyle(
                  color: isConnected.value! ? Colors.green : Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
