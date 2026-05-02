import { PubSubService } from '../_shared/pubSubServiceInterface';

export type AuditEvent = {
  timestamp: string;
  eventType: string;
  userId?: string;
  userName?: string;
  details: Record<string, unknown>;
};

type AuditBackend = (event: AuditEvent) => void;

/**
 * AuditTrailService — logs clinical actions for HIPAA/IHE ATNA compliance.
 *
 * Tracks: study access, measurement CRUD, annotations, exports, auth events.
 * Events are emitted to configurable backends (console, HTTP, custom).
 */
class AuditTrailService extends PubSubService {
  public static readonly EVENTS = {
    AUDIT_EVENT_LOGGED: 'event::auditEventLogged',
  };

  public static REGISTRATION = {
    name: 'auditTrailService',
    altName: 'AuditTrailService',
    create: ({ configuration = {} }) => {
      return new AuditTrailService(configuration);
    },
  };

  private _enabled: boolean;
  private _backends: AuditBackend[];
  private _userId: string | null;
  private _userName: string | null;
  private _httpEndpoint: string | null;

  constructor(configuration: Record<string, unknown> = {}) {
    super(AuditTrailService.EVENTS);
    this._enabled = (configuration.enabled as boolean) ?? false;
    this._httpEndpoint = (configuration.httpEndpoint as string) ?? null;
    this._backends = [];
    this._userId = null;
    this._userName = null;

    // Default backend: structured console logging
    this._backends.push((event: AuditEvent) => {
      console.debug('[AUDIT]', JSON.stringify(event));
    });

    // HTTP backend if configured
    if (this._httpEndpoint) {
      this._backends.push((event: AuditEvent) => {
        fetch(this._httpEndpoint!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true,
        }).catch(() => {});
      });
    }
  }

  public setUser(userId: string, userName?: string): void {
    this._userId = userId;
    this._userName = userName ?? null;
  }

  public addBackend(backend: AuditBackend): void {
    this._backends.push(backend);
  }

  public log(eventType: string, details: Record<string, unknown> = {}): void {
    if (!this._enabled) {
      return;
    }

    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: this._userId ?? undefined,
      userName: this._userName ?? undefined,
      details,
    };

    this._backends.forEach(backend => {
      try {
        backend(event);
      } catch {
        // Never let audit logging break the application
      }
    });

    this._broadcastEvent(AuditTrailService.EVENTS.AUDIT_EVENT_LOGGED, event);
  }

  // Convenience methods for common clinical events

  public logStudyAccess(
    studyInstanceUID: string,
    action: 'open' | 'close',
    extra: Record<string, unknown> = {}
  ): void {
    this.log('STUDY_ACCESS', { studyInstanceUID, action, ...extra });
  }

  public logMeasurement(
    action: 'create' | 'update' | 'delete',
    measurement: Record<string, unknown>
  ): void {
    this.log('MEASUREMENT', {
      action,
      measurementUID: measurement.uid,
      toolType: measurement.toolName,
      label: measurement.label,
      studyInstanceUID: measurement.referenceStudyUID,
      seriesInstanceUID: measurement.referenceSeriesUID,
    });
  }

  public logExport(format: string, studyInstanceUID: string): void {
    this.log('EXPORT', { format, studyInstanceUID });
  }

  public logAuthentication(action: 'login' | 'logout'): void {
    this.log('AUTHENTICATION', { action });
  }

  public logViewportAction(
    action: string,
    viewportId: string,
    details: Record<string, unknown> = {}
  ): void {
    this.log('VIEWPORT_ACTION', { action, viewportId, ...details });
  }
}

export default AuditTrailService;
