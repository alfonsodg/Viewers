import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '@state';

interface PatientVerificationDialogProps {
  patientName: string;
  patientId: string;
  patientBirthDate?: string;
  patientSex?: string;
  studyDescription?: string;
  studyDate?: string;
  onConfirm: () => void;
  onReject: () => void;
}

const STORAGE_KEY = 'patientVerification:confirmed';

/**
 * Patient Identity Verification Dialog.
 *
 * Requires the user to confirm they are viewing the correct patient's images
 * before the study loads. Meets Joint Commission NPSG.01.01.01 requirements.
 *
 * Configuration (app-config.js):
 *   patientVerification: {
 *     enabled: true,
 *     mode: 'always' | 'once-per-study' | 'never',
 *   }
 */
export function PatientVerificationDialog({
  patientName,
  patientId,
  patientBirthDate,
  patientSex,
  studyDescription,
  studyDate,
  onConfirm,
  onReject,
}: PatientVerificationDialogProps) {
  const { t } = useTranslation('Common');
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = useCallback(() => {
    setConfirmed(true);
    onConfirm();
  }, [onConfirm]);

  if (confirmed) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-verify-title"
    >
      <div className="bg-popover w-full max-w-md rounded-lg border border-blue-500/30 p-6 shadow-2xl">
        <h2
          id="patient-verify-title"
          className="mb-4 text-center text-lg font-semibold text-white"
        >
          {t('Confirm Patient Identity')}
        </h2>

        <p className="text-muted-foreground mb-4 text-center text-sm">
          {t('Please verify you are viewing the correct patient before proceeding.')}
        </p>

        <div className="bg-background mb-6 rounded p-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <span className="text-muted-foreground text-sm">{t('Patient Name')}</span>
            <span className="text-lg font-bold text-white">{patientName || '—'}</span>

            <span className="text-muted-foreground text-sm">{t('Patient ID')}</span>
            <span className="font-mono text-white">{patientId || '—'}</span>

            {patientBirthDate && (
              <>
                <span className="text-muted-foreground text-sm">{t('Date of Birth')}</span>
                <span className="text-white">{patientBirthDate}</span>
              </>
            )}

            {patientSex && (
              <>
                <span className="text-muted-foreground text-sm">{t('Sex')}</span>
                <span className="text-white">{patientSex}</span>
              </>
            )}

            {studyDescription && (
              <>
                <span className="text-muted-foreground text-sm">{t('Study')}</span>
                <span className="text-white">
                  {studyDescription}
                  {studyDate ? ` (${studyDate})` : ''}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 rounded bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            onClick={onReject}
          >
            {t('Wrong Patient')}
          </button>
          <button
            type="button"
            className="flex-1 rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            onClick={handleConfirm}
            autoFocus
          >
            {t('Confirm Identity')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if verification is needed for a given study based on config and history.
 */
export function shouldVerifyPatient(
  mode: 'always' | 'once-per-study' | 'never',
  studyInstanceUID: string
): boolean {
  if (mode === 'never') {
    return false;
  }
  if (mode === 'always') {
    return true;
  }
  // once-per-study: check sessionStorage
  const confirmed = sessionStorage.getItem(`${STORAGE_KEY}:${studyInstanceUID}`);
  return !confirmed;
}

/**
 * Mark a study as verified in the current session.
 */
export function markPatientVerified(studyInstanceUID: string): void {
  sessionStorage.setItem(`${STORAGE_KEY}:${studyInstanceUID}`, new Date().toISOString());
}

export default PatientVerificationDialog;
