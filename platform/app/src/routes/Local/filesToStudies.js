import FileLoaderService from './fileLoaderService';
import { DicomMetadataStore, utils } from '@ohif/core';

const { isDicomFile } = utils;

const processFile = async file => {
  try {
    // Skip non-DICOM files (PDF handled separately by fileLoaderService)
    if (file.type !== 'application/pdf') {
      const isDicom = await isDicomFile(file);
      if (!isDicom) {
        return;
      }
    }

    const fileLoaderService = new FileLoaderService(file);
    const imageId = fileLoaderService.addFile(file);
    const image = await fileLoaderService.loadFile(file, imageId);
    const dicomJSONDataset = await fileLoaderService.getDataset(image, imageId);

    DicomMetadataStore.addInstance(dicomJSONDataset);
  } catch (error) {
    console.debug(error.name, ':Error when trying to load and process local files:', error.message);
  }
};

export default async function filesToStudies(files) {
  const processFilesPromises = files.map(processFile);
  await Promise.all(processFilesPromises);

  return DicomMetadataStore.getStudyInstanceUIDs();
}
