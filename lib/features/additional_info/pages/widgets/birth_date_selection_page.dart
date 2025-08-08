import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import '../../presentation/providers/additional_info_provider.dart';

class BirthDateSelectionPage extends HookConsumerWidget {
  final GlobalKey<FormBuilderState> formKey;
  final DateTime? initialValue;
  final VoidCallback? onNext;

  const BirthDateSelectionPage({
    super.key,
    required this.formKey,
    required this.initialValue,
    this.onNext,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final additionalInfo = ref.watch(additionalInfoProvider);

    // Get initial values from provider or use defaults
    final initialDate = additionalInfo.birthDate ??
        initialValue ??
        DateTime.now().subtract(
            const Duration(days: 365 * 25)); // Default to 25 years ago

    return _BirthDateSelectionContent(
      formKey: formKey,
      initialValue: initialDate,
      onNext: onNext,
    );
  }
}

class _BirthDateSelectionContent extends StatefulWidget {
  final GlobalKey<FormBuilderState> formKey;
  final DateTime initialValue;
  final VoidCallback? onNext;

  const _BirthDateSelectionContent({
    required this.formKey,
    required this.initialValue,
    required this.onNext,
  });

  @override
  State<_BirthDateSelectionContent> createState() =>
      _BirthDateSelectionContentState();
}

class _BirthDateSelectionContentState extends State<_BirthDateSelectionContent>
    with TickerProviderStateMixin {
  late FixedExtentScrollController _monthController;
  late FixedExtentScrollController _dayController;
  late FixedExtentScrollController _yearController;

  late int _selectedMonth;
  late int _selectedDay;
  late int _selectedYear;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  List<String> get _months => [
        'additional_info.jalali_months.farvardin'.tr(),
        'additional_info.jalali_months.ordibehesht'.tr(),
        'additional_info.jalali_months.khordad'.tr(),
        'additional_info.jalali_months.tir'.tr(),
        'additional_info.jalali_months.mordad'.tr(),
        'additional_info.jalali_months.shahrivar'.tr(),
        'additional_info.jalali_months.mehr'.tr(),
        'additional_info.jalali_months.aban'.tr(),
        'additional_info.jalali_months.azar'.tr(),
        'additional_info.jalali_months.dey'.tr(),
        'additional_info.jalali_months.bahman'.tr(),
        'additional_info.jalali_months.esfand'.tr(),
      ];

  @override
  void initState() {
    super.initState();

    // Initialize animations
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));

    // Initialize with initial value first
    final jalaliDate = _gregorianToJalali(widget.initialValue);
    _selectedMonth = jalaliDate['month']! - 1; // 0-based index
    _selectedDay = jalaliDate['day']! - 1; // 0-based index
    _selectedYear = jalaliDate['year']!;

    _monthController = FixedExtentScrollController(initialItem: _selectedMonth);
    _dayController = FixedExtentScrollController(initialItem: _selectedDay);
    _yearController =
        FixedExtentScrollController(initialItem: _getYearIndex(_selectedYear));

    // Start animation
    _animationController.forward();

    // Sync with form value after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Use a microtask to ensure widgets are fully built
      Future.microtask(() {
        if (mounted) {
          _syncControllersWithFormValue();
        }
      });
    });
  }

  @override
  void dispose() {
    _monthController.dispose();
    _dayController.dispose();
    _yearController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Sync controllers with current form value when dependencies change
    // Only sync if controllers have clients (widgets are built)
    if (_monthController.hasClients &&
        _dayController.hasClients &&
        _yearController.hasClients) {
      _syncControllersWithFormValue();
    }
  }

  void _syncControllersWithFormValue() {
    final currentFormValue =
        widget.formKey.currentState?.value['birthDate'] as DateTime?;
    if (currentFormValue != null) {
      final jalaliDate = _gregorianToJalali(currentFormValue);
      final newMonth = jalaliDate['month']! - 1;
      final newDay = jalaliDate['day']! - 1;
      final newYear = jalaliDate['year']!;

      // Only update if the values are different to avoid unnecessary jumps
      if (_selectedMonth != newMonth) {
        _selectedMonth = newMonth;
        if (_monthController.hasClients) {
          _monthController.jumpToItem(newMonth);
        }
      }
      if (_selectedDay != newDay) {
        _selectedDay = newDay;
        if (_dayController.hasClients) {
          _dayController.jumpToItem(newDay);
        }
      }
      if (_selectedYear != newYear) {
        _selectedYear = newYear;
        if (_yearController.hasClients) {
          _yearController.jumpToItem(_getYearIndex(newYear));
        }
      }
    } else {
      // If no form value, update the form with current selection
      // Only update if controllers have clients
      if (_monthController.hasClients &&
          _dayController.hasClients &&
          _yearController.hasClients) {
        _updateFormValue();
      }
    }
  }

  int _getYearIndex(int year) {
    // Assuming years from 1300 to 1400 (Jalali)
    return year - 1300;
  }

  List<int> _getDaysInMonth(int month, int year) {
    if (month < 6) return List.generate(31, (index) => index + 1);
    if (month < 11) return List.generate(30, (index) => index + 1);
    // Esfand (last month)
    return List.generate(_isLeapYear(year) ? 30 : 29, (index) => index + 1);
  }

  bool _isLeapYear(int year) {
    // Jalali leap year calculation
    return (year + 12) % 33 % 4 == 1;
  }

  Map<String, int> _gregorianToJalali(DateTime gregorianDate) {
    // Simple conversion - in a real app, you'd use a proper Jalali calendar library
    // This is a simplified version for demonstration
    int year = gregorianDate.year - 621;
    int month = gregorianDate.month + 2;
    if (month > 12) {
      month -= 12;
      year += 1;
    }
    int day = gregorianDate.day;

    // Adjust for Jalali calendar specifics
    if (month <= 6) {
      day += 10;
    } else {
      day += 9;
    }

    if (day > 30) {
      day -= 30;
      month += 1;
    }

    if (month > 12) {
      month = 1;
      year += 1;
    }

    return {'year': year, 'month': month, 'day': day};
  }

  DateTime _jalaliToGregorian(int year, int month, int day) {
    // Simple conversion back to Gregorian
    // This is a simplified version for demonstration
    int gregorianYear = year + 621;
    int gregorianMonth = month - 2;
    if (gregorianMonth <= 0) {
      gregorianMonth += 12;
      gregorianYear -= 1;
    }

    int gregorianDay = day;
    if (month <= 6) {
      gregorianDay -= 10;
    } else {
      gregorianDay -= 9;
    }

    if (gregorianDay <= 0) {
      gregorianDay += 30;
      gregorianMonth -= 1;
    }

    if (gregorianMonth <= 0) {
      gregorianMonth = 12;
      gregorianYear -= 1;
    }

    return DateTime(gregorianYear, gregorianMonth, gregorianDay);
  }

  void _updateFormValue() {
    final gregorianDate = _jalaliToGregorian(
      _selectedYear,
      _selectedMonth + 1,
      _selectedDay + 1,
    );

    final formState = widget.formKey.currentState;
    if (formState != null) {
      final field = formState.fields['birthDate'];
      if (field != null) {
        field.didChange(gregorianDate);
        // Trigger validation
        field.validate();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final daysInMonth = _getDaysInMonth(_selectedMonth, _selectedYear);
    final years = List.generate(101, (index) => 1300 + index); // 1300 to 1400

    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Header Section
              _buildHeader(),

              const SizedBox(height: 40),

              // Date Picker Section
              Expanded(
                child: _buildDatePicker(daysInMonth, years),
              ),

              const SizedBox(height: 24),

              // Hidden form field for birth date
              FormBuilderField<DateTime>(
                name: 'birthDate',
                initialValue: widget.initialValue,
                validator: (value) {
                  if (value == null) {
                    return 'additional_info.birth_date_required'.tr();
                  }
                  return null;
                },
                builder: (FormFieldState<DateTime> field) {
                  return const SizedBox.shrink();
                },
              ),

              // Next button
              _buildNextButton(),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Icon
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).colorScheme.primary,
                Theme.of(context).colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Icon(
            Icons.calendar_today,
            size: 40,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: 24),

        // Title
        Text(
          'additional_info.birth_date_title'.tr(),
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 28,
                height: 1.2,
              ),
          textAlign: TextAlign.center,
        ),

        const SizedBox(height: 12),

        // Subtitle
        Text(
          'additional_info.birth_date_subtitle'.tr(),
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 16,
                height: 1.5,
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildDatePicker(List<int> daysInMonth, List<int> years) {
    return Container(
      height: 280,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.grey.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with labels
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'additional_info.month'.tr(),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  child: Text(
                    'additional_info.day'.tr(),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  child: Text(
                    'additional_info.year'.tr(),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),

          // Date picker wheels
          Expanded(
            child: Row(
              children: [
                // Month Picker
                Expanded(
                  child: _buildWheelPicker(
                    controller: _monthController,
                    items: _months,
                    onSelectedItemChanged: (index) {
                      setState(() {
                        _selectedMonth = index;
                        _updateDaysList();
                      });
                      _updateFormValue();
                    },
                  ),
                ),

                // Divider
                Container(
                  width: 1,
                  height: double.infinity,
                  color: Colors.grey.withOpacity(0.2),
                ),

                // Day Picker
                Expanded(
                  child: _buildWheelPicker(
                    controller: _dayController,
                    items: daysInMonth
                        .map((day) => day.toString().padLeft(2, '0'))
                        .toList(),
                    onSelectedItemChanged: (index) {
                      setState(() {
                        _selectedDay = index;
                      });
                      _updateFormValue();
                    },
                  ),
                ),

                // Divider
                Container(
                  width: 1,
                  height: double.infinity,
                  color: Colors.grey.withOpacity(0.2),
                ),

                // Year Picker
                Expanded(
                  child: _buildWheelPicker(
                    controller: _yearController,
                    items: years.map((year) => year.toString()).toList(),
                    onSelectedItemChanged: (index) {
                      setState(() {
                        _selectedYear = years[index];
                        _updateDaysList();
                      });
                      _updateFormValue();
                    },
                  ),
                ),
              ],
            ),
          ),

          // Selection indicator
          Container(
            height: 4,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Theme.of(context).colorScheme.primary,
                  Theme.of(context).colorScheme.primary.withOpacity(0.7),
                ],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNextButton() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            try {
              // Ensure form value is updated before validation
              _updateFormValue();
              if (widget.onNext != null) {
                widget.onNext!();
              }
            } catch (e) {
              // Handle any errors gracefully
              debugPrint('Error in Next button: $e');
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: double.infinity,
            height: double.infinity,
            alignment: Alignment.center,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'next'.tr(),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.white,
                      ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.arrow_forward_ios,
                  color: Colors.white,
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _updateDaysList() {
    final daysInMonth = _getDaysInMonth(_selectedMonth, _selectedYear);
    if (_selectedDay >= daysInMonth.length) {
      _selectedDay = daysInMonth.length - 1;
      _dayController.jumpToItem(_selectedDay);
    }
  }

  Widget _buildWheelPicker({
    required FixedExtentScrollController controller,
    required List<String> items,
    required ValueChanged<int> onSelectedItemChanged,
  }) {
    return ListWheelScrollView.useDelegate(
      controller: controller,
      itemExtent: 60,
      diameterRatio: 1.8,
      perspective: 0.008,
      onSelectedItemChanged: onSelectedItemChanged,
      childDelegate: ListWheelChildBuilderDelegate(
        builder: (context, index) {
          if (index < 0 || index >= items.length) return null;

          final isSelected = controller.selectedItem == index;

          return AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            alignment: Alignment.center,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isSelected
                    ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                items[index],
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.w500,
                      fontSize: isSelected ? 18 : 16,
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withOpacity(0.7),
                    ),
              ),
            ),
          );
        },
        childCount: items.length,
      ),
    );
  }
}
