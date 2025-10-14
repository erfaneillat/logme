import 'package:cal_ai/services/api_service.dart';
import 'package:cal_ai/features/subscription/data/models/offer_model.dart';

class OfferService {
  final ApiService _apiService;

  OfferService(this._apiService);

  /// Get active offers for the current user
  Future<List<OfferModel>> getActiveOffers() async {
    try {
      final response = await _apiService.get('/api/offers/active');

      if (response['success'] == true && response['data'] != null) {
        final offersData = response['data']['offers'] as List<dynamic>;
        return offersData
            .map((json) => OfferModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      print('Error fetching active offers: $e');
      return [];
    }
  }

  /// Get offer by ID or slug
  Future<OfferModel?> getOfferById(String id) async {
    try {
      final response = await _apiService.get('/api/offers/$id');

      if (response['success'] == true && response['data'] != null) {
        return OfferModel.fromJson(
            response['data']['offer'] as Map<String, dynamic>);
      }

      return null;
    } catch (e) {
      print('Error fetching offer: $e');
      return null;
    }
  }
}
