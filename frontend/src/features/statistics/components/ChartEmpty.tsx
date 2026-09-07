import * as AppIcons from '../../../shared/icons/AppIcons';

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="wp-training-stats-chart__empty">
      <span className="wp-training-stats-chart__empty-icon"><AppIcons.BarsIcon aria-hidden="true" width={52} height={52} /></span>
      <p>{message}</p>
    </div>
  );
}
