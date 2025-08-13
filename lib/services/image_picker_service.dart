import 'package:image_picker/image_picker.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class ImagePickerService {
  final ImagePicker _picker = ImagePicker();

  /// Picks an image from the given [source]. Returns `XFile?`.
  /// [imageQuality] 1..100, default 90.
  Future<XFile?> pickImage({
    required ImageSource source,
    int imageQuality = 90,
    double? maxWidth,
    double? maxHeight,
  }) async {
    final file = await _picker.pickImage(
      source: source,
      imageQuality: imageQuality,
      maxWidth: maxWidth,
      maxHeight: maxHeight,
    );
    return file;
  }
}

final imagePickerServiceProvider = Provider<ImagePickerService>((ref) {
  return ImagePickerService();
});
