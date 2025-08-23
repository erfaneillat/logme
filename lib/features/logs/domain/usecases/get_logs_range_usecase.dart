import '../../domain/entities/daily_log.dart';
import '../../domain/repositories/logs_repository.dart';

class GetLogsRangeUseCase {
  final LogsRepository repository;
  GetLogsRangeUseCase(this.repository);

  Future<List<DailyLogEntity>> execute({
    required String startIso,
    required String endIso,
  }) => repository.getLogsRange(startIso: startIso, endIso: endIso);
}
