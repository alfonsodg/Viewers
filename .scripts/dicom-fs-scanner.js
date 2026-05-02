#!/usr/bin/env node

/**
 * DICOM Filesystem Scanner — generates DICOMjson for OHIF Viewer
 *
 * Scans a directory of DICOM files and produces a JSON manifest compatible
 * with OHIF's dicomjson datasource, enabling viewing without a DICOMweb server.
 *
 * Usage:
 *   node dicom-fs-scanner.js --input /path/to/dicom --output studies.json --baseUrl http://localhost:8080/dicom
 *
 * The baseUrl should point to a static HTTP server serving the DICOM files.
 * For example: `npx serve /path/to/dicom --cors -l 8080`
 *
 * Then configure OHIF:
 *   dataSources: [{
 *     namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
 *     sourceName: 'filesystem',
 *     configuration: { friendlyName: 'Local Filesystem' }
 *   }]
 *
 * And open: http://localhost:3000/viewer/dicomjson?url=http://localhost:8080/studies.json
 */

const fs = require('fs');
const path = require('path');

// Minimal DICOM parser — reads tags from file header without full parsing
function readDicomTags(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  // Check DICM magic bytes
  let offset = 0;
  if (buffer.length > 132) {
    const magic = buffer.slice(128, 132).toString('ascii');
    if (magic === 'DICM') {
      offset = 132;
    }
  }

  // If no DICM prefix, check for implicit VR
  if (offset === 0 && buffer.length > 4) {
    const group = buffer.readUInt16LE(0);
    if (group !== 0x0002 && group !== 0x0008) {
      return null; // Not a DICOM file
    }
  }

  const tags = {};
  const view = new DataView(ab);

  // Parse meta header (explicit VR little-endian)
  let isExplicitVR = true;
  const EXPLICIT_VR_TAGS = new Set(['OB', 'OD', 'OF', 'OL', 'OW', 'SQ', 'UC', 'UN', 'UR', 'UT']);

  try {
    while (offset < buffer.length - 8) {
      const group = view.getUint16(offset, true);
      const element = view.getUint16(offset + 2, true);
      const tagKey = `${group.toString(16).padStart(4, '0')}${element.toString(16).padStart(4, '0')}`.toUpperCase();

      let vr, valueLength;

      if (isExplicitVR && offset >= 132) {
        // After meta header, check transfer syntax to determine VR type
        vr = String.fromCharCode(buffer[offset + 4], buffer[offset + 5]);

        if (EXPLICIT_VR_TAGS.has(vr)) {
          valueLength = view.getUint32(offset + 8, true);
          offset += 12;
        } else if (/^[A-Z]{2}$/.test(vr)) {
          valueLength = view.getUint16(offset + 6, true);
          offset += 8;
        } else {
          // Implicit VR
          isExplicitVR = false;
          valueLength = view.getUint32(offset + 4, true);
          offset += 8;
          vr = 'UN';
        }
      } else {
        // Implicit VR
        valueLength = view.getUint32(offset + 4, true);
        offset += 8;
        vr = 'UN';
      }

      if (valueLength === 0xFFFFFFFF || valueLength > buffer.length - offset) {
        break;
      }

      // Extract string-type tags
      if (['LO', 'SH', 'PN', 'DA', 'TM', 'UI', 'CS', 'DS', 'IS', 'AS', 'DT'].includes(vr)) {
        tags[tagKey] = buffer.slice(offset, offset + valueLength).toString('ascii').trim().replace(/\0/g, '');
      }

      offset += valueLength;

      // Stop after pixel data tag or if we've read enough
      if (group === 0x7FE0 || (group > 0x0040 && Object.keys(tags).length > 20)) {
        break;
      }
    }
  } catch {
    // Partial parse is OK
  }

  return tags;
}

// Map raw hex tags to DICOM keywords
const TAG_MAP = {
  '00080005': 'SpecificCharacterSet',
  '00080008': 'ImageType',
  '00080016': 'SOPClassUID',
  '00080018': 'SOPInstanceUID',
  '00080020': 'StudyDate',
  '00080030': 'StudyTime',
  '00080050': 'AccessionNumber',
  '00080060': 'Modality',
  '00080070': 'Manufacturer',
  '0008103E': 'SeriesDescription',
  '00081030': 'StudyDescription',
  '00100010': 'PatientName',
  '00100020': 'PatientID',
  '00100030': 'PatientBirthDate',
  '00100040': 'PatientSex',
  '0020000D': 'StudyInstanceUID',
  '0020000E': 'SeriesInstanceUID',
  '00200010': 'StudyID',
  '00200011': 'SeriesNumber',
  '00200013': 'InstanceNumber',
  '00280010': 'Rows',
  '00280011': 'Columns',
  '00280100': 'BitsAllocated',
  '00280004': 'PhotometricInterpretation',
  '00280008': 'NumberOfFrames',
};

function mapTags(rawTags) {
  const mapped = {};
  for (const [hex, keyword] of Object.entries(TAG_MAP)) {
    if (rawTags[hex] != null) {
      mapped[keyword] = rawTags[hex];
    }
  }
  return mapped;
}

function scanDirectory(dirPath) {
  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');
  const baseUrlIdx = args.indexOf('--baseUrl');

  if (inputIdx === -1 || outputIdx === -1 || baseUrlIdx === -1) {
    console.error('Usage: node dicom-fs-scanner.js --input <dir> --output <file.json> --baseUrl <url>');
    console.error('Example: node dicom-fs-scanner.js --input ./dicom --output studies.json --baseUrl http://localhost:8080');
    process.exit(1);
  }

  const inputDir = path.resolve(args[inputIdx + 1]);
  const outputFile = args[outputIdx + 1];
  const baseUrl = args[baseUrlIdx + 1].replace(/\/$/, '');

  console.error(`Scanning ${inputDir}...`);
  const files = scanDirectory(inputDir);
  console.error(`Found ${files.length} files`);

  const studies = new Map();
  let processed = 0;
  let skipped = 0;

  for (const filePath of files) {
    const rawTags = readDicomTags(filePath);
    if (!rawTags) {
      skipped++;
      continue;
    }

    const tags = mapTags(rawTags);
    if (!tags.StudyInstanceUID || !tags.SeriesInstanceUID || !tags.SOPInstanceUID) {
      skipped++;
      continue;
    }

    const relativePath = path.relative(inputDir, filePath);
    const fileUrl = `${baseUrl}/${relativePath.split(path.sep).join('/')}`;

    // Build study → series → instance hierarchy
    if (!studies.has(tags.StudyInstanceUID)) {
      studies.set(tags.StudyInstanceUID, {
        StudyInstanceUID: tags.StudyInstanceUID,
        StudyDate: tags.StudyDate || '',
        StudyTime: tags.StudyTime || '',
        StudyDescription: tags.StudyDescription || '',
        PatientName: tags.PatientName || '',
        PatientID: tags.PatientID || '',
        AccessionNumber: tags.AccessionNumber || '',
        Modalities: '',
        NumInstances: 0,
        series: new Map(),
      });
    }

    const study = studies.get(tags.StudyInstanceUID);

    if (!study.series.has(tags.SeriesInstanceUID)) {
      study.series.set(tags.SeriesInstanceUID, {
        SeriesInstanceUID: tags.SeriesInstanceUID,
        SeriesNumber: tags.SeriesNumber || '',
        SeriesDescription: tags.SeriesDescription || '',
        Modality: tags.Modality || '',
        instances: [],
      });
    }

    const series = study.series.get(tags.SeriesInstanceUID);
    series.instances.push({
      metadata: tags,
      url: `wadouri:${fileUrl}`,
    });

    study.NumInstances++;
    processed++;
  }

  // Finalize: convert Maps to arrays, compute Modalities
  const output = {
    studies: Array.from(studies.values()).map(study => {
      const seriesArray = Array.from(study.series.values());
      const modalities = [...new Set(seriesArray.map(s => s.Modality).filter(Boolean))].join('\\');
      return {
        ...study,
        Modalities: modalities,
        series: seriesArray.map(s => ({
          ...s,
          instances: s.instances,
        })),
      };
    }),
  };

  // Remove Map objects from output
  output.studies.forEach(s => delete s.series.forEach);

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.error(`Done: ${processed} instances in ${studies.size} studies (${skipped} files skipped)`);
  console.error(`Output: ${outputFile}`);
  console.error(`\nTo use with OHIF:`);
  console.error(`  1. Serve DICOM files: npx serve ${inputDir} --cors -l 8080`);
  console.error(`  2. Open: http://localhost:3000/viewer/dicomjson?url=http://localhost:8080/${path.basename(outputFile)}`);
}

main();
