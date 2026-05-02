import { isValidMode, NON_IMAGE_MODALITIES } from '../index';

describe('isValidMode', () => {
  describe('with modeModalities defined', () => {
    const context = {
      modeModalities: ['CT', 'MR', 'PT', 'US', 'DX', 'CR', 'XA'],
      nonModeModalities: NON_IMAGE_MODALITIES,
    };

    it('accepts a single supported modality', () => {
      const result = isValidMode.call(context, { modalities: 'CT' });
      expect(result.valid).toBe(true);
    });

    it('accepts multi-modality study with supported modality', () => {
      const result = isValidMode.call(context, { modalities: 'CT\\PT' });
      expect(result.valid).toBe(true);
    });

    it('rejects unsupported modality', () => {
      const result = isValidMode.call(context, { modalities: 'UNKNOWN' });
      expect(result.valid).toBe(false);
    });

    it('returns description on rejection', () => {
      const result = isValidMode.call(context, { modalities: 'UNKNOWN' });
      expect(result.description).toContain('None of the mode modalities match');
    });
  });

  describe('with array modeModalities (multi-modality requirement)', () => {
    const context = {
      modeModalities: [['CT', 'PT'], 'MR'],
      nonModeModalities: NON_IMAGE_MODALITIES,
    };

    it('accepts when all modalities in array are present', () => {
      const result = isValidMode.call(context, { modalities: 'CT\\PT' });
      expect(result.valid).toBe(true);
    });

    it('accepts single modality match', () => {
      const result = isValidMode.call(context, { modalities: 'MR' });
      expect(result.valid).toBe(true);
    });
  });

  describe('without modeModalities (fallback to nonModeModalities)', () => {
    const context = {
      nonModeModalities: NON_IMAGE_MODALITIES,
    };

    it('accepts study with imaging modality', () => {
      const result = isValidMode.call(context, { modalities: 'CT' });
      expect(result.valid).toBe(true);
    });

    it('rejects study with only non-imaging modalities', () => {
      const result = isValidMode.call(context, { modalities: 'SEG' });
      expect(result.valid).toBe(false);
    });

    it('accepts mixed study with at least one imaging modality', () => {
      const result = isValidMode.call(context, { modalities: 'CT\\SEG' });
      expect(result.valid).toBe(true);
    });

    it('rejects study with only SR and SEG', () => {
      const result = isValidMode.call(context, { modalities: 'SR\\SEG' });
      expect(result.valid).toBe(false);
    });
  });
});
