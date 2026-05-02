/**
 * Calibration status tracking for measurement safety.
 *
 * Determines the calibration state of an image based on DICOM metadata,
 * providing warnings when measurements may be inaccurate.
 *
 * IEC 62304 §5.2 — measurement accuracy requirements
 * DICOM PS3.3 C.7.6.3 — Pixel Spacing vs Imager Pixel Spacing
 */

export enum CalibrationSource {
  /** Pixel spacing from DICOM header (most reliable) */
  DICOM_HEADER = 'dicom_header',
  /** Imager/detector pixel spacing only (less reliable for patient measurements) */
  DETECTOR_SPACING = 'detector_spacing',
  /** User-performed manual calibration */
  MANUAL = 'manual',
  /** Ultrasound region calibration */
  US_REGION = 'us_region',
  /** No calibration available — measurements in pixels only */
  UNCALIBRATED = 'uncalibrated',
}

export enum CalibrationSeverity {
  /** Calibrated from DICOM header or US region — reliable */
  OK = 'ok',
  /** Detector spacing only — may not reflect patient dimensions */
  WARNING = 'warning',
  /** No calibration — measurements are unreliable */
  CRITICAL = 'critical',
}

export interface CalibrationInfo {
  source: CalibrationSource;
  severity: CalibrationSeverity;
  message: string;
  pixelSpacing?: number[];
}

/**
 * Determine calibration status from instance metadata.
 */
export function getCalibrationInfo(instance: Record<string, unknown>): CalibrationInfo {
  if (!instance) {
    return {
      source: CalibrationSource.UNCALIBRATED,
      severity: CalibrationSeverity.CRITICAL,
      message: 'No image metadata available. Measurements are unreliable.',
    };
  }

  const pixelSpacing = instance.PixelSpacing as number[] | undefined;
  const imagerPixelSpacing = instance.ImagerPixelSpacing as number[] | undefined;
  const modality = instance.Modality as string;

  // Ultrasound: check for SequenceOfUltrasoundRegions
  if (modality === 'US') {
    const usRegions = instance.SequenceOfUltrasoundRegions;
    if (usRegions) {
      return {
        source: CalibrationSource.US_REGION,
        severity: CalibrationSeverity.OK,
        message: 'Calibrated from ultrasound region data.',
        pixelSpacing,
      };
    }
  }

  // Best case: PixelSpacing present (patient-level calibration)
  if (pixelSpacing?.length === 2 && pixelSpacing[0] > 0 && pixelSpacing[1] > 0) {
    return {
      source: CalibrationSource.DICOM_HEADER,
      severity: CalibrationSeverity.OK,
      message: 'Calibrated from DICOM pixel spacing.',
      pixelSpacing,
    };
  }

  // Detector spacing only — common in CR/DX/MG
  if (imagerPixelSpacing?.length === 2 && imagerPixelSpacing[0] > 0 && imagerPixelSpacing[1] > 0) {
    return {
      source: CalibrationSource.DETECTOR_SPACING,
      severity: CalibrationSeverity.WARNING,
      message:
        'Using detector pixel spacing only. Measurements may not reflect true patient dimensions due to magnification.',
      pixelSpacing: imagerPixelSpacing,
    };
  }

  // No calibration
  return {
    source: CalibrationSource.UNCALIBRATED,
    severity: CalibrationSeverity.CRITICAL,
    message: 'No pixel spacing available. Measurements are unreliable and should not be used for clinical decisions.',
  };
}

export default getCalibrationInfo;
