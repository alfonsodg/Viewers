/**
 * Enhanced Hanging Protocol Validator — semantic validation beyond structural checks.
 *
 * The existing _validateProtocol in HangingProtocolService performs structural
 * validation (required fields, viewport generation). This module adds:
 *
 * 1. Selector conflict detection (overlapping matching rules)
 * 2. Viewport-displaySet reference validation
 * 3. Protocol versioning metadata
 * 4. Validation report generation for clinical approval workflows
 *
 * IEC 62304 §5.3 — software architecture safety requirements
 */

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  location?: string;
}

export interface ValidationReport {
  protocolId: string;
  protocolName: string;
  valid: boolean;
  timestamp: string;
  issues: ValidationIssue[];
}

/**
 * Validate a hanging protocol with semantic checks.
 */
export function validateProtocol(protocol: Record<string, unknown>): ValidationReport {
  const issues: ValidationIssue[] = [];
  const id = (protocol.id as string) || 'unknown';
  const name = (protocol.name as string) || id;

  // 1. Basic structure
  if (!protocol.id) {
    issues.push({ severity: 'error', code: 'HP001', message: 'Protocol missing id' });
  }

  const stages = protocol.stages as Array<Record<string, unknown>>;
  if (!stages?.length) {
    issues.push({ severity: 'error', code: 'HP002', message: 'Protocol has no stages' });
  }

  const selectors = protocol.displaySetSelectors as Record<string, Record<string, unknown>>;
  if (!selectors || Object.keys(selectors).length === 0) {
    issues.push({
      severity: 'error',
      code: 'HP003',
      message: 'Protocol has no displaySetSelectors',
    });
  }

  // 2. Selector validation
  if (selectors) {
    for (const [selectorId, selector] of Object.entries(selectors)) {
      const rules = selector.seriesMatchingRules as Array<Record<string, unknown>>;
      if (!rules?.length) {
        issues.push({
          severity: 'error',
          code: 'HP010',
          message: `Selector "${selectorId}" has no seriesMatchingRules`,
          location: `displaySetSelectors.${selectorId}`,
        });
      }

      // Check for overly broad selectors (no attribute constraints)
      if (rules?.length === 1) {
        const rule = rules[0];
        if (!rule.attribute && !rule.constraint) {
          issues.push({
            severity: 'warning',
            code: 'HP011',
            message: `Selector "${selectorId}" has a single rule with no attribute constraint — may match unintended series`,
            location: `displaySetSelectors.${selectorId}`,
          });
        }
      }
    }

    // 3. Detect selector conflicts (same matching rules)
    const selectorEntries = Object.entries(selectors);
    for (let i = 0; i < selectorEntries.length; i++) {
      for (let j = i + 1; j < selectorEntries.length; j++) {
        const [idA, selA] = selectorEntries[i];
        const [idB, selB] = selectorEntries[j];
        const rulesA = JSON.stringify(selA.seriesMatchingRules);
        const rulesB = JSON.stringify(selB.seriesMatchingRules);
        if (rulesA === rulesB) {
          issues.push({
            severity: 'warning',
            code: 'HP012',
            message: `Selectors "${idA}" and "${idB}" have identical matching rules — may cause ambiguous display set assignment`,
            location: `displaySetSelectors`,
          });
        }
      }
    }
  }

  // 4. Stage/viewport validation
  if (stages) {
    stages.forEach((stage, stageIdx) => {
      const viewports = stage.viewports as Array<Record<string, unknown>>;
      if (!viewports && !stage.viewportStructure) {
        issues.push({
          severity: 'error',
          code: 'HP020',
          message: `Stage ${stageIdx} has no viewports and no viewportStructure`,
          location: `stages[${stageIdx}]`,
        });
      }

      // Check viewport-displaySet references
      if (viewports) {
        viewports.forEach((vp, vpIdx) => {
          const displaySets = vp.displaySets as Array<Record<string, unknown>>;
          if (displaySets) {
            displaySets.forEach((ds, dsIdx) => {
              const dsId = ds.id as string;
              if (dsId && selectors && !selectors[dsId]) {
                issues.push({
                  severity: 'error',
                  code: 'HP021',
                  message: `Viewport ${vpIdx} references displaySet selector "${dsId}" which does not exist`,
                  location: `stages[${stageIdx}].viewports[${vpIdx}].displaySets[${dsIdx}]`,
                });
              }
            });
          }
        });
      }
    });
  }

  // 5. Protocol metadata checks
  if (!protocol.name) {
    issues.push({
      severity: 'info',
      code: 'HP030',
      message: 'Protocol has no name — will default to id',
    });
  }

  if (!protocol.protocolMatchingRules) {
    issues.push({
      severity: 'info',
      code: 'HP031',
      message: 'Protocol has no protocolMatchingRules — will match all studies',
    });
  }

  return {
    protocolId: id,
    protocolName: name,
    valid: !issues.some(i => i.severity === 'error'),
    timestamp: new Date().toISOString(),
    issues,
  };
}

/**
 * Format a validation report as a human-readable string.
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines = [
    `Hanging Protocol Validation Report`,
    `Protocol: ${report.protocolName} (${report.protocolId})`,
    `Status: ${report.valid ? 'VALID' : 'INVALID'}`,
    `Date: ${report.timestamp}`,
    ``,
  ];

  if (report.issues.length === 0) {
    lines.push('No issues found.');
  } else {
    const grouped = { error: [], warning: [], info: [] };
    report.issues.forEach(i => grouped[i.severity].push(i));

    for (const [severity, items] of Object.entries(grouped)) {
      if (items.length > 0) {
        lines.push(`${severity.toUpperCase()} (${items.length}):`);
        items.forEach(i => {
          lines.push(`  [${i.code}] ${i.message}${i.location ? ` @ ${i.location}` : ''}`);
        });
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

export default validateProtocol;
