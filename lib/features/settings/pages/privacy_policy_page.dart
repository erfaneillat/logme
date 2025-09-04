import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.arrow_back_ios, size: 18),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'privacy.title'.tr(),
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: Colors.black87,
              ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFF8B5CF6).withOpacity(0.1),
                      const Color(0xFF7C3AED).withOpacity(0.1),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF8B5CF6).withOpacity(0.1),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.privacy_tip_outlined,
                      color: const Color(0xFF8B5CF6),
                      size: 32,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'privacy.welcome_title'.tr(),
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                              ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'privacy.last_updated'
                          .tr(namedArgs: {'date': 'December 2024'}),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Privacy Content
              _buildPrivacySection(
                context,
                icon: Icons.info_outline,
                title: 'privacy.overview_title'.tr(),
                content: 'privacy.overview_content'.tr(),
                color: const Color(0xFF059669),
              ),

              _buildPrivacySection(
                context,
                icon: Icons.folder_outlined,
                title: 'privacy.data_collection_title'.tr(),
                content: 'privacy.data_collection_content'.tr(),
                color: const Color(0xFFDC2626),
              ),

              _buildPrivacySection(
                context,
                icon: Icons.storage,
                title: 'privacy.data_usage_title'.tr(),
                content: 'privacy.data_usage_content'.tr(),
                color: const Color(0xFF7C3AED),
              ),

              _buildPrivacySection(
                context,
                icon: Icons.share,
                title: 'privacy.data_sharing_title'.tr(),
                content: 'privacy.data_sharing_content'.tr(),
                color: const Color(0xFFEAB308),
              ),

              _buildPrivacySection(
                context,
                icon: Icons.security,
                title: 'privacy.security_title'.tr(),
                content: 'privacy.security_content'.tr(),
                color: const Color(0xFF0EA5E9),
              ),

              _buildPrivacySection(
                context,
                icon: Icons.track_changes,
                title: 'privacy.cookies_title'.tr(),
                content: 'privacy.cookies_content'.tr(),
                color: const Color(0xFFEF4444),
              ),

              _buildPrivacySection(
                context,
                icon: Icons.account_circle,
                title: 'privacy.user_rights_title'.tr(),
                content: 'privacy.user_rights_content'.tr(),
                color: const Color(0xFF10B981),
              ),

              _buildPrivacySection(
                context,
                icon: Icons.contact_support,
                title: 'privacy.contact_title'.tr(),
                content: 'privacy.contact_content'.tr(),
                color: const Color(0xFF06B6D4),
              ),

              const SizedBox(height: 32),

              // Footer
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.verified_user_outlined,
                      color: const Color(0xFF8B5CF6),
                      size: 32,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'privacy.footer_title'.tr(),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'privacy.footer_content'.tr(),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                            height: 1.4,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPrivacySection(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String content,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
          ),
        ],
      ),
    );
  }
}
