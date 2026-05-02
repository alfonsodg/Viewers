import { PubSubService } from '../_shared/pubSubServiceInterface';

export interface WorklistItem {
  accessionNumber: string;
  patientName: string;
  patientId: string;
  patientBirthDate?: string;
  patientSex?: string;
  scheduledProcedureStepDescription?: string;
  scheduledStationAETitle?: string;
  scheduledProcedureStepStartDate?: string;
  scheduledProcedureStepStartTime?: string;
  modality?: string;
  requestedProcedureId?: string;
  requestedProcedureDescription?: string;
  studyInstanceUID?: string;
  referringPhysicianName?: string;
  scheduledPerformingPhysicianName?: string;
}

/**
 * ModalityWorklistService — integrates with MWL SCPs via a bridge API.
 *
 * Since browsers cannot perform DIMSE C-FIND, this service queries a
 * backend MWL bridge that translates HTTP requests to DICOM MWL queries.
 *
 * IHE Scheduled Workflow (SWF) profile, DICOM PS3.4 Annex K.
 *
 * Configuration (app-config.js):
 *   modalityWorklist: {
 *     enabled: true,
 *     apiEndpoint: 'http://localhost:8092/api/worklist',
 *   }
 */
class ModalityWorklistService extends PubSubService {
  public static readonly EVENTS = {
    WORKLIST_UPDATED: 'event::worklistUpdated',
    WORKLIST_ERROR: 'event::worklistError',
  };

  public static REGISTRATION = {
    name: 'modalityWorklistService',
    altName: 'ModalityWorklistService',
    create: ({ configuration = {} }) => {
      return new ModalityWorklistService(configuration);
    },
  };

  private _enabled: boolean;
  private _apiEndpoint: string | null;
  private _items: WorklistItem[];

  constructor(configuration: Record<string, unknown> = {}) {
    super(ModalityWorklistService.EVENTS);
    this._enabled = (configuration.enabled as boolean) ?? false;
    this._apiEndpoint = (configuration.apiEndpoint as string) ?? null;
    this._items = [];
  }

  public isEnabled(): boolean {
    return this._enabled && !!this._apiEndpoint;
  }

  public getItems(): WorklistItem[] {
    return this._items;
  }

  /**
   * Query the MWL bridge for scheduled procedures.
   */
  public async query(filters: Record<string, string> = {}): Promise<WorklistItem[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${this._apiEndpoint}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`MWL query failed: ${response.status}`);
      }

      this._items = await response.json();
      this._broadcastEvent(ModalityWorklistService.EVENTS.WORKLIST_UPDATED, {
        items: this._items,
      });
      return this._items;
    } catch (error) {
      this._broadcastEvent(ModalityWorklistService.EVENTS.WORKLIST_ERROR, { error });
      return [];
    }
  }

  /**
   * Link an opened study to a scheduled procedure (MPPS-like).
   */
  public async linkStudyToProcedure(
    studyInstanceUID: string,
    accessionNumber: string
  ): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const response = await fetch(`${this._apiEndpoint}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyInstanceUID, accessionNumber }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default ModalityWorklistService;
