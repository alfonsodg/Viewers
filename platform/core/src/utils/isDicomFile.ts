/**
 * Detect whether a file or ArrayBuffer contains DICOM data by checking magic bytes.
 *
 * A standard DICOM file has a 128-byte preamble followed by "DICM" at offset 128.
 * Some legacy DICOM files lack the preamble — these start directly with a DICOM
 * tag (commonly group 0008, element 0005 for SpecificCharacterSet).
 */

const DICM_PREFIX_OFFSET = 128;
const DICM_BYTES = [0x44, 0x49, 0x43, 0x4d]; // "DICM"

/**
 * Check if an ArrayBuffer contains DICOM data via magic bytes.
 */
export function isDicomBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength <= DICM_PREFIX_OFFSET + 4) {
    return isDicomWithoutPreamble(buffer);
  }

  const view = new Uint8Array(buffer, DICM_PREFIX_OFFSET, 4);
  if (DICM_BYTES.every((b, i) => view[i] === b)) {
    return true;
  }

  return isDicomWithoutPreamble(buffer);
}

/**
 * Check for DICOM without standard preamble (implicit VR little-endian).
 * Looks for common first tag: (0008,0005) SpecificCharacterSet or (0008,0008) ImageType
 * or (0002,0000) FileMetaInformationGroupLength.
 */
function isDicomWithoutPreamble(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) {
    return false;
  }

  const view = new DataView(buffer);
  const group = view.getUint16(0, true);
  const element = view.getUint16(2, true);

  // Common first tags in DICOM files without preamble
  return (
    (group === 0x0002 && element === 0x0000) || // FileMetaInformationGroupLength
    (group === 0x0002 && element === 0x0001) || // FileMetaInformationVersion
    (group === 0x0008 && element === 0x0005) || // SpecificCharacterSet
    (group === 0x0008 && element === 0x0008) // ImageType
  );
}

/**
 * Check if a File object is a DICOM file by reading its first 132 bytes.
 */
export async function isDicomFile(file: File): Promise<boolean> {
  // Known DICOM MIME types
  if (file.type === 'application/dicom' || file.type === 'application/dcm') {
    return true;
  }

  // Known DICOM extensions
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'dcm' || ext === 'dicom') {
    return true;
  }

  // Read first 132 bytes for magic byte detection
  const slice = file.slice(0, DICM_PREFIX_OFFSET + 4);
  const buffer = await slice.arrayBuffer();
  return isDicomBuffer(buffer);
}

export default isDicomFile;
