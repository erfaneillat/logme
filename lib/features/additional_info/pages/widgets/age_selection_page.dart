import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'common_next_button.dart';

class AgeSelectionPage extends StatefulWidget {
  final GlobalKey<FormBuilderState> formKey;
  final DateTime? initialValue;
  final VoidCallback? onNext;

  const AgeSelectionPage({
    super.key,
    required this.formKey,
    required this.initialValue,
    this.onNext,
  });

  @override
  State<AgeSelectionPage> createState() => _AgeSelectionPageState();
}

class _AgeSelectionPageState extends State<AgeSelectionPage> {
  late FixedExtentScrollController _monthController;
  late FixedExtentScrollController _dayController;
  late FixedExtentScrollController _yearController;

  late int _selectedMonth;
  late int _selectedDay;
  late int _selectedYear;

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

    // Initialize with initial value first
    final defaultDate = widget.initialValue ??
        DateTime.now().subtract(const Duration(days: 365 * 25));
    final jalaliDate = _gregorianToJalali(defaultDate);
    _selectedMonth = jalaliDate['month']! - 1; // 0-based index
    _selectedDay = jalaliDate['day']! - 1; // 0-based index
    _selectedYear = jalaliDate['year']!;

    _monthController = FixedExtentScrollController(initialItem: _selectedMonth);
    _dayController = FixedExtentScrollController(initialItem: _selectedDay);
    _yearController =
        FixedExtentScrollController(initialItem: _getYearIndex(_selectedYear));

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

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          const SizedBox(height: 40),

          // Title
          Text(
            'additional_info.birth_date_title'.tr(),
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 16),

          // Subtitle
          Text(
            'additional_info.birth_date_subtitle'.tr(),
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 48),

          // Custom Date Picker
          Container(
            height: 200,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Theme.of(context).colorScheme.outline,
                width: 1,
              ),
            ),
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

          const Spacer(),

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
          CommonNextButton(
            onPressed: () {
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
          ),
          const SizedBox(height: 12),
        ],
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
      itemExtent: 50,
      diameterRatio: 1.5,
      perspective: 0.01,
      onSelectedItemChanged: onSelectedItemChanged,
      childDelegate: ListWheelChildBuilderDelegate(
        builder: (context, index) {
          if (index < 0 || index >= items.length) return null;

          return Container(
            alignment: Alignment.center,
            child: Text(
              items[index],
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: controller.selectedItem == index
                        ? Theme.of(context).colorScheme.onSurface
                        : Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.5),
                  ),
            ),
          );
        },
        childCount: items.length,
      ),
    );
  }
}
