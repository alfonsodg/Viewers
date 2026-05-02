import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icons } from '../Icons';

export interface CalibrationWarningBannerProps {
  severity: 'ok' | 'warning' | 'critical';
  message: string;
}

/**
 * Banner displayed on viewports when measurement calibration is uncertain.
 * Shows warning (yellow) for detector-only spacing, critical (red) for uncalibrated.
 */
export function CalibrationWarningBanner({ severity, message }: CalibrationWarningBannerProps) {
  if (severity === 'ok') {
    return null;
  }

  const { t } = useTranslation('Common');

  const styles = useMemo(
    () =>
      severity === 'critical'
        ? 'bg-red-900/80 border-red-500 text-red-200'
        : 'bg-yellow-900/80 border-yellow-500 text-yellow-200',
    [severity]
  );

  const icon = severity === 'critical' ? 'status-alert' : 'status-warning';
  const label =
    severity === 'critical'
      ? t('Uncalibrated — measurements unreliable')
      : t('Detector spacing only — measurements approximate');

  return (
    <div
      className={`pointer-events-none absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded border px-3 py-1.5 text-xs ${styles}`}
      role="alert"
      aria-live="polite"
    >
      <Icons.ByName
        name={icon}
        className="h-4 w-4 flex-shrink-0"
      />
      <span>{label}</span>
    </div>
  );
}

export default CalibrationWarningBanner;
