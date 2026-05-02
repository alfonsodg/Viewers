# Development Standards - OHIF Viewers Fork

Standards applied to the `alfonsodg/Viewers` fork of OHIF/Viewers.

## Language & Versions

- **TypeScript**: 5.x (strict mode enabled via `tsconfig.json`)
- **React**: 18.x (functional components, hooks only — no class components)
- **Node.js**: 24.x LTS (build), 22.x (maintenance)
- **Yarn**: 1.x (with `--frozen-lockfile` in CI/Docker)

## Code Style

- **ESLint**: Strengthened rules (`@typescript-eslint/no-explicit-any: warn`,
  `@typescript-eslint/explicit-function-return-type: warn`,
  `react/no-deprecated: error`)
- **Prettier**: Project defaults
- **Conventional Commits**: `<type>(<scope>): <subject> (#issue)`
- **Comments**: Explain "why", not "what"
- **No hardcoded values**: Use constants, configs, or i18n keys

## Architecture Patterns

- **Extensions**: Self-contained feature modules registered via `getModuleTypes()`
- **Modes**: Workflow configurations combining extensions for specific use cases
- **Services**: Singleton services registered in `ServicesManager`
  (e.g., `AuditTrailService`, `ModalityWorklistService`)
- **Panels**: UI components registered via `getPanelModule()` in extensions
- **Commands**: Actions registered via `getCommandsModule()`

## React Patterns

- Functional components only (no `class` components)
- Hooks for state and lifecycle (`useState`, `useEffect`, `useCallback`)
- `useTranslation()` hook for all user-facing strings
- `ErrorBoundary` wrapping for panel content
- Proper cleanup in `useEffect` return functions

## i18n

- All user-facing strings must use i18n keys via `useTranslation()`
- English keys in `platform/i18n/src/locales/en-US/Common.json`
- Spanish translations in `platform/i18n/src/locales/es/Common.json`
- No hardcoded strings in UI components

## Security

- Docker: No `chmod 777`, use `chmod 755`; pin base images; add `HEALTHCHECK`
- Nginx: Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `X-XSS-Protection`, `Content-Security-Policy`, `Referrer-Policy`)
- Config: `loadDynamicConfig` hardened against XSS
- Dependencies: `webpack-dev-middleware` CVE patched
- SSH: Use `ssh-keyscan` instead of `StrictHostKeyChecking no`

## Docker

- Multi-stage builds (build + runtime)
- `QUICK_BUILD=false` for production
- `--frozen-lockfile` for reproducible installs
- Base image pinned to specific digest
- `HEALTHCHECK` instruction included

## Testing

- Jest for unit tests (`jest.config.js` configured for modes)
- Mode validation tests (`isValidMode` with 10+ test cases)
- Playwright for UI validation (screenshots to `debug/`)

## Accessibility

- Interactive elements use `<button>` (not clickable `<div>`)
- `aria-label` on icon-only buttons
- `ErrorBoundary` on panel content for graceful degradation

## Clinical Features

- `AuditTrailService`: DICOM Audit Trail (ATNA) logging
- `CalibrationWarningBanner`: Pixel spacing validation warnings
- `PatientVerificationDialog`: Patient identity confirmation
- Window/Level presets for MR, CR/DX, MG, US, NM modalities
- DICOM Conformance Statement documentation
- DICOM Print SCU service
- Modality Worklist service
- TID 2000 Structured Report generation
- Semantic Hanging Protocol validation

## Deployment

- Build: `APP_CONFIG=config/dcm4chee.js PUBLIC_URL=/ohif/ yarn run build`
- Deploy: `rsync -az --delete platform/app/dist/ user@server:/var/www/ohif/`
- Nginx: Static files with `alias` + `try_files` + security headers
- DICOMweb: Relative URLs proxied through Nginx to dcm4chee
