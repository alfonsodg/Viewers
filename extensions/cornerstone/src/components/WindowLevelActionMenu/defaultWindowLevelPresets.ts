// The following are the default window level presets and can be further
// configured via the customization service.
const defaultWindowLevelPresets = {
  CT: [
    { id: 'ct-soft-tissue', description: 'Soft tissue', window: '400', level: '40' },
    { id: 'ct-lung', description: 'Lung', window: '1500', level: '-600' },
    { id: 'ct-liver', description: 'Liver', window: '150', level: '90' },
    { id: 'ct-bone', description: 'Bone', window: '2500', level: '480' },
    { id: 'ct-brain', description: 'Brain', window: '80', level: '40' },
  ],

  PT: [
    { id: 'pt-default', description: 'Default', window: '5', level: '2.5' },
    { id: 'pt-suv-3', description: 'SUV', window: '0', level: '3' },
    { id: 'pt-suv-5', description: 'SUV', window: '0', level: '5' },
    { id: 'pt-suv-7', description: 'SUV', window: '0', level: '7' },
    { id: 'pt-suv-8', description: 'SUV', window: '0', level: '8' },
    { id: 'pt-suv-10', description: 'SUV', window: '0', level: '10' },
    { id: 'pt-suv-15', description: 'SUV', window: '0', level: '15' },
  ],

  MR: [
    { id: 'mr-default', description: 'Default', window: '400', level: '200' },
    { id: 'mr-t1', description: 'T1', window: '500', level: '250' },
    { id: 'mr-t2', description: 'T2', window: '600', level: '300' },
    { id: 'mr-flair', description: 'FLAIR', window: '1200', level: '600' },
    { id: 'mr-dwi', description: 'DWI', window: '1000', level: '500' },
  ],

  CR: [
    { id: 'cr-chest', description: 'Chest', window: '2048', level: '1024' },
    { id: 'cr-bone', description: 'Bone', window: '4096', level: '2048' },
    { id: 'cr-abdomen', description: 'Abdomen', window: '1024', level: '512' },
  ],

  DX: [
    { id: 'dx-chest', description: 'Chest', window: '2048', level: '1024' },
    { id: 'dx-bone', description: 'Bone', window: '4096', level: '2048' },
    { id: 'dx-abdomen', description: 'Abdomen', window: '1024', level: '512' },
  ],

  MG: [
    { id: 'mg-standard', description: 'Standard', window: '2048', level: '1024' },
    { id: 'mg-enhanced', description: 'Enhanced', window: '4096', level: '2048' },
    { id: 'mg-dense', description: 'Dense tissue', window: '1024', level: '512' },
  ],

  US: [
    { id: 'us-default', description: 'Default', window: '256', level: '128' },
    { id: 'us-msk', description: 'Musculoskeletal', window: '200', level: '100' },
  ],

  NM: [
    { id: 'nm-default', description: 'Default', window: '256', level: '128' },
    { id: 'nm-bone-scan', description: 'Bone Scan', window: '512', level: '256' },
  ],
};

export default defaultWindowLevelPresets;
