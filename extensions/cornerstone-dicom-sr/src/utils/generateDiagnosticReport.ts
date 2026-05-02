import dcmjs from 'dcmjs';

const { DicomMetaDictionary } = dcmjs.data;

/**
 * SR Template IDs supported by this module.
 */
export const SR_TEMPLATE_IDS = {
  TID_1500: '1500', // Measurement Report (already supported by @cornerstonejs/adapters)
  TID_2000: '2000', // Basic Diagnostic Imaging Report
} as const;

/**
 * Coding scheme designators used in SR templates.
 */
const CodingScheme = {
  DCM: 'DCM',
  SCT: 'SCT',
  LN: 'LN',
} as const;

interface CodedEntry {
  CodeValue: string;
  CodingSchemeDesignator: string;
  CodeMeaning: string;
}

interface ContentItem {
  RelationshipType: string;
  ValueType: string;
  ConceptNameCodeSequence: CodedEntry;
  TextValue?: string;
  ContentSequence?: ContentItem[];
  ReferencedSOPSequence?: {
    ReferencedSOPClassUID: string;
    ReferencedSOPInstanceUID: string;
  };
}

interface DiagnosticReportOptions {
  /** Study metadata */
  studyInstanceUID: string;
  seriesInstanceUID: string;
  patientName?: string;
  patientId?: string;
  studyDate?: string;
  studyDescription?: string;
  accessionNumber?: string;
  /** Report content */
  findings: string;
  impression?: string;
  recommendation?: string;
  /** Referenced images */
  referencedImages?: Array<{
    sopClassUID: string;
    sopInstanceUID: string;
  }>;
  /** Metadata */
  reporterName?: string;
  institutionName?: string;
}

/**
 * Generate a TID 2000 Basic Diagnostic Imaging Report as a DICOM SR dataset.
 *
 * TID 2000 structure:
 *   - Language of Content Item and Descendants
 *   - Observation Context (observer)
 *   - Procedure Reported
 *   - Findings
 *   - Impression
 *   - Recommendation (optional)
 *   - Image References (optional)
 */
export function generateDiagnosticReport(
  options: DiagnosticReportOptions
): Record<string, unknown> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');

  const contentSequence: ContentItem[] = [];

  // Language of Content
  contentSequence.push({
    RelationshipType: 'HAS CONCEPT MOD',
    ValueType: 'CODE',
    ConceptNameCodeSequence: {
      CodeValue: '121049',
      CodingSchemeDesignator: CodingScheme.DCM,
      CodeMeaning: 'Language of Content Item and Descendants',
    },
  });

  // Observer Context — Person Observer
  if (options.reporterName) {
    contentSequence.push({
      RelationshipType: 'HAS OBS CONTEXT',
      ValueType: 'PNAME',
      ConceptNameCodeSequence: {
        CodeValue: '121008',
        CodingSchemeDesignator: CodingScheme.DCM,
        CodeMeaning: 'Person Observer Name',
      },
      TextValue: options.reporterName,
    });
  }

  // Procedure Reported
  contentSequence.push({
    RelationshipType: 'HAS CONCEPT MOD',
    ValueType: 'CODE',
    ConceptNameCodeSequence: {
      CodeValue: '121058',
      CodingSchemeDesignator: CodingScheme.DCM,
      CodeMeaning: 'Procedure Reported',
    },
  });

  // Findings
  contentSequence.push({
    RelationshipType: 'CONTAINS',
    ValueType: 'CONTAINER',
    ConceptNameCodeSequence: {
      CodeValue: '121070',
      CodingSchemeDesignator: CodingScheme.DCM,
      CodeMeaning: 'Findings',
    },
    ContentSequence: [
      {
        RelationshipType: 'CONTAINS',
        ValueType: 'TEXT',
        ConceptNameCodeSequence: {
          CodeValue: '121071',
          CodingSchemeDesignator: CodingScheme.DCM,
          CodeMeaning: 'Finding',
        },
        TextValue: options.findings,
      },
    ],
  });

  // Impression
  if (options.impression) {
    contentSequence.push({
      RelationshipType: 'CONTAINS',
      ValueType: 'CONTAINER',
      ConceptNameCodeSequence: {
        CodeValue: '121072',
        CodingSchemeDesignator: CodingScheme.DCM,
        CodeMeaning: 'Impression',
      },
      ContentSequence: [
        {
          RelationshipType: 'CONTAINS',
          ValueType: 'TEXT',
          ConceptNameCodeSequence: {
            CodeValue: '121073',
            CodingSchemeDesignator: CodingScheme.DCM,
            CodeMeaning: 'Impression',
          },
          TextValue: options.impression,
        },
      ],
    });
  }

  // Recommendation
  if (options.recommendation) {
    contentSequence.push({
      RelationshipType: 'CONTAINS',
      ValueType: 'TEXT',
      ConceptNameCodeSequence: {
        CodeValue: '121074',
        CodingSchemeDesignator: CodingScheme.DCM,
        CodeMeaning: 'Recommendation',
      },
      TextValue: options.recommendation,
    });
  }

  // Image References
  if (options.referencedImages?.length) {
    const imageRefs: ContentItem[] = options.referencedImages.map(img => ({
      RelationshipType: 'CONTAINS',
      ValueType: 'IMAGE',
      ConceptNameCodeSequence: {
        CodeValue: '121191',
        CodingSchemeDesignator: CodingScheme.DCM,
        CodeMeaning: 'Referenced Segment',
      },
      ReferencedSOPSequence: {
        ReferencedSOPClassUID: img.sopClassUID,
        ReferencedSOPInstanceUID: img.sopInstanceUID,
      },
    }));

    contentSequence.push({
      RelationshipType: 'CONTAINS',
      ValueType: 'CONTAINER',
      ConceptNameCodeSequence: {
        CodeValue: '121180',
        CodingSchemeDesignator: CodingScheme.DCM,
        CodeMeaning: 'Key Images',
      },
      ContentSequence: imageRefs,
    });
  }

  // Build the SR dataset
  const sopInstanceUID = dcmjs.data.DicomMetaDictionary.uid();
  const seriesInstanceUID = dcmjs.data.DicomMetaDictionary.uid();

  return {
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.88.22', // Enhanced SR
    SOPInstanceUID: sopInstanceUID,
    StudyInstanceUID: options.studyInstanceUID,
    SeriesInstanceUID: seriesInstanceUID,
    Modality: 'SR',
    Manufacturer: 'OHIF',
    ContentDate: dateStr,
    ContentTime: timeStr,
    PatientName: options.patientName || '',
    PatientID: options.patientId || '',
    StudyDate: options.studyDate || dateStr,
    StudyDescription: options.studyDescription || '',
    AccessionNumber: options.accessionNumber || '',
    InstitutionName: options.institutionName || '',
    SeriesDescription: 'Diagnostic Imaging Report',
    SeriesNumber: '9999',
    InstanceNumber: '1',
    ValueType: 'CONTAINER',
    ConceptNameCodeSequence: {
      CodeValue: '18782-3',
      CodingSchemeDesignator: CodingScheme.LN,
      CodeMeaning: 'Radiology Study observation (findings)',
    },
    ContinuityOfContent: 'SEPARATE',
    SpecificCharacterSet: 'ISO_IR 192',
    ContentTemplateSequence: {
      MappingResource: 'DCMR',
      TemplateIdentifier: SR_TEMPLATE_IDS.TID_2000,
    },
    ContentSequence: contentSequence,
    CompletionFlag: 'COMPLETE',
    VerificationFlag: 'UNVERIFIED',
  };
}

export default generateDiagnosticReport;
