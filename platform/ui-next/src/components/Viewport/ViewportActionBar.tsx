import React, {
  MouseEventHandler,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Icons } from '@ohif/ui-next';
import { PatientInfo } from './PatientInfo';

/**
 * This is the modern Viewport Action Bar, showing patient info, series date,
 * series description, and optional next/prev arrows if there's enough screen width.
 */
type ViewportActionBarProps = {
  studyData: any;
  onArrowsClick: (arrow: string) => void;
  onDoubleClick: MouseEventHandler;
  getStatusComponent: () => ReactElement;
};

function ViewportActionBar({
  studyData,
  onArrowsClick,
  onDoubleClick,
  getStatusComponent,
}: ViewportActionBarProps): JSX.Element {
  const { label, studyDate, seriesDescription, patientInformation } = studyData;
  const { patientName, patientSex, patientAge, MRN, thickness, thicknessUnits, spacing, scanner } =
    patientInformation;

  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const showPatientInfoElemRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // handle click outside to close patient info
  const handleClickOutside = useCallback(
    (evt: MouseEvent) => {
      if (
        showPatientInfo &&
        showPatientInfoElemRef.current &&
        !showPatientInfoElemRef.current.contains(evt.target as Node)
      ) {
        setShowPatientInfo(false);
      }
    },
    [showPatientInfoElemRef, showPatientInfo]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div
      className="pointer-events-auto flex h-8 shrink-0 select-none items-center overflow-visible whitespace-nowrap px-2 text-base"
      onDoubleClick={onDoubleClick}
    >
      {getStatusComponent()}
      {!!label?.length && <span className="text-muted-foreground text-large ml-1">{label}</span>}
      <div className="border-secondary-light mx-2 border-l py-2"></div>
      <span
        data-cy="studyDate"
        className="text-white"
      >
        {studyDate}
      </span>
      <div className="border-secondary-light mx-2 border-l py-2"></div>
      <span className="text-muted-foreground mr-1 overflow-hidden text-ellipsis">
        {seriesDescription}
      </span>
      {/* Prev/Next icons */}
      <button
        type="button"
        className="appearance-none border-none bg-transparent p-0 cursor-pointer"
        onClick={() => onArrowsClick('left')}
        aria-label="Previous series"
      >
        <Icons.ByName
          className="hover:text-highlight ml-auto mr-2 text-white"
          name="chevron-prev"
        />
      </button>
      <button
        type="button"
        className="appearance-none border-none bg-transparent p-0 cursor-pointer"
        onClick={() => onArrowsClick('right')}
        aria-label="Next series"
      >
        <Icons.ByName
          className="hover:text-highlight mr-2 text-white"
          name="chevron-next"
        />
      </button>
      {/* Patient Info */}
      <button
        type="button"
        className="appearance-none border-none bg-transparent p-0 cursor-pointer"
        onClick={() => setShowPatientInfo(!showPatientInfo)}
        aria-expanded={showPatientInfo}
        aria-label="Toggle patient information"
      >
        <PatientInfo
          showPatientInfoRef={showPatientInfoElemRef}
          isOpen={showPatientInfo}
          patientName={patientName}
          patientSex={patientSex}
          patientAge={patientAge}
          MRN={MRN}
          thickness={thickness}
          thicknessUnits={thicknessUnits}
          spacing={spacing}
          scanner={scanner}
        />
      </button>
    </div>
  );
}

ViewportActionBar.propTypes = {
  onArrowsClick: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func,
  studyData: PropTypes.shape({
    label: PropTypes.string.isRequired,
    studyDate: PropTypes.string.isRequired,
    seriesDescription: PropTypes.string.isRequired,
    patientInformation: PropTypes.shape({
      patientName: PropTypes.string,
      patientSex: PropTypes.string,
      patientAge: PropTypes.string,
      MRN: PropTypes.string,
      thickness: PropTypes.string,
      thicknessUnits: PropTypes.string,
      spacing: PropTypes.string,
      scanner: PropTypes.string,
    }),
  }).isRequired,
  getStatusComponent: PropTypes.func.isRequired,
};

export { ViewportActionBar };
