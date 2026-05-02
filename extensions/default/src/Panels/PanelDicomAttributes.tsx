import React, { useState, useMemo, useCallback, useEffect } from 'react';
import dcmjs from 'dcmjs';
import { classes, Types } from '@ohif/core';
import { useSystem } from '@ohif/core';
import { InputFilter, ScrollArea } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';

const { ImageSet } = classes;
const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;

/** Key clinical attributes shown at the top of the panel */
const KEY_ATTRIBUTES = [
  { keyword: 'PatientName', label: 'Patient Name' },
  { keyword: 'PatientID', label: 'Patient ID' },
  { keyword: 'PatientBirthDate', label: 'DOB' },
  { keyword: 'PatientSex', label: 'Sex' },
  { keyword: 'StudyDate', label: 'Study Date' },
  { keyword: 'StudyDescription', label: 'Study Description' },
  { keyword: 'AccessionNumber', label: 'Accession' },
  { keyword: 'SeriesDescription', label: 'Series Description' },
  { keyword: 'Modality', label: 'Modality' },
  { keyword: 'SliceThickness', label: 'Slice Thickness' },
  { keyword: 'PixelSpacing', label: 'Pixel Spacing' },
  { keyword: 'WindowCenter', label: 'Window Center' },
  { keyword: 'WindowWidth', label: 'Window Width' },
];

function formatValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.join('\\');
  }
  if (typeof value === 'object') {
    if ((value as Record<string, unknown>).Alphabetic) {
      return (value as Record<string, string>).Alphabetic;
    }
    if ((value as Record<string, unknown>).InlineBinary) {
      return '[Binary Data]';
    }
  }
  return String(value);
}

function PanelDicomAttributes({ servicesManager }: withAppTypes) {
  const { t } = useTranslation('Common');
  const { viewportGridService, displaySetService } = servicesManager.services;
  const [filterValue, setFilterValue] = useState('');
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);

  // Get metadata from active viewport's display set
  const updateMetadata = useCallback(() => {
    const { activeViewportId } = viewportGridService.getState();
    const viewportInfo = viewportGridService.getState().viewports?.get(activeViewportId);
    if (!viewportInfo?.displaySetInstanceUIDs?.length) {
      setMetadata(null);
      return;
    }

    const displaySetUID = viewportInfo.displaySetInstanceUIDs[0];
    const displaySet = displaySetService.getDisplaySetByUID(displaySetUID);
    if (!displaySet) {
      setMetadata(null);
      return;
    }

    const instance =
      displaySet instanceof ImageSet
        ? displaySet.images?.[0]
        : displaySet.instance || displaySet;

    setMetadata(instance);
  }, [viewportGridService, displaySetService]);

  useEffect(() => {
    updateMetadata();

    const sub = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      updateMetadata
    );

    return () => sub.unsubscribe();
  }, [viewportGridService, updateMetadata]);

  // Key attributes section
  const keyAttributes = useMemo(() => {
    if (!metadata) {
      return [];
    }
    return KEY_ATTRIBUTES.map(({ keyword, label }) => ({
      label,
      value: formatValue(metadata[keyword]),
    })).filter(attr => attr.value);
  }, [metadata]);

  // All tags for search
  const allTags = useMemo(() => {
    if (!metadata) {
      return [];
    }
    const tags: { tag: string; keyword: string; vr: string; value: string }[] = [];
    for (const keyword of Object.keys(metadata)) {
      if (keyword === '_vrMap') {
        continue;
      }
      const tagInfo = nameMap[keyword];
      if (!tagInfo) {
        continue;
      }
      if (tagInfo.vr === 'SQ') {
        continue;
      }
      tags.push({
        tag: tagInfo.tag,
        keyword,
        vr: tagInfo.vr,
        value: formatValue(metadata[keyword]),
      });
    }
    tags.sort((a, b) => (a.tag < b.tag ? -1 : 1));
    return tags;
  }, [metadata]);

  // Filtered tags
  const filteredTags = useMemo(() => {
    if (!filterValue) {
      return allTags;
    }
    const filter = filterValue.toLowerCase();
    return allTags.filter(
      tag =>
        tag.keyword.toLowerCase().includes(filter) ||
        tag.tag.toLowerCase().includes(filter) ||
        tag.value.toLowerCase().includes(filter)
    );
  }, [allTags, filterValue]);

  const handleCopy = useCallback((value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
  }, []);

  if (!metadata) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t('No study loaded')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      {/* Key Attributes */}
      <div className="bg-background rounded p-2">
        <h3 className="text-foreground mb-2 text-sm font-semibold">Key Attributes</h3>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {keyAttributes.map(({ label, value }) => (
            <React.Fragment key={label}>
              <span className="text-muted-foreground text-xs">{label}</span>
              <span
                className="cursor-pointer truncate text-xs text-white hover:text-primary"
                title={`${value} (click to copy)`}
                onClick={() => handleCopy(value)}
              >
                {value}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Search */}
      <InputFilter
        className="text-muted-foreground"
        onChange={setFilterValue}
      >
        <InputFilter.SearchIcon />
        <InputFilter.Input
          placeholder={t('Search attributes...')}
          className="pl-9 pr-9"
        />
        <InputFilter.ClearButton className="text-primary mr-0.5 p-0.5" />
      </InputFilter>

      {/* Tag Table */}
      <ScrollArea className="flex-1">
        <table className="w-full text-xs">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="text-muted-foreground p-1 text-left font-normal">Tag</th>
              <th className="text-muted-foreground p-1 text-left font-normal">Keyword</th>
              <th className="text-muted-foreground p-1 text-left font-normal">Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredTags.map(tag => (
              <tr
                key={tag.tag}
                className="hover:bg-muted/50 border-b border-muted"
              >
                <td className="text-muted-foreground whitespace-nowrap p-1 font-mono">
                  {tag.tag}
                </td>
                <td className="p-1 text-white">{tag.keyword}</td>
                <td
                  className="cursor-pointer truncate p-1 text-white hover:text-primary"
                  title={`${tag.value} (click to copy)`}
                  onClick={() => handleCopy(tag.value)}
                  style={{ maxWidth: '150px' }}
                >
                  {tag.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTags.length === 0 && (
          <div className="text-muted-foreground p-4 text-center text-sm">
            {filterValue ? t('No matching attributes') : t('No attributes available')}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default PanelDicomAttributes;
