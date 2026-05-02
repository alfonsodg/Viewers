import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppConfig } from '@state';

/**
 * ShareView route — handles public share links for studies.
 *
 * URL format: /share/:token
 *
 * The token is validated against the share API endpoint configured in
 * appConfig.shareLinks.apiEndpoint. On success, the user is redirected
 * to the viewer with the study loaded.
 *
 * Configuration (app-config.js):
 *   shareLinks: {
 *     enabled: true,
 *     apiEndpoint: 'http://localhost:8090/api/shares',
 *   }
 */
function ShareView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [appConfig] = useAppConfig();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validateShare() {
      const shareConfig = appConfig?.shareLinks;
      if (!shareConfig?.enabled || !shareConfig?.apiEndpoint) {
        setError('Share links are not configured on this server.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${shareConfig.apiEndpoint}/${token}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'error',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('This share link does not exist or has expired.');
          } else if (response.status === 401) {
            setError('This share link requires a password.');
          } else {
            setError(`Failed to validate share link (${response.status}).`);
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Redirect to viewer with the study
        const { studyInstanceUID, datasource, mode } = data;
        const viewerMode = mode || 'viewer';
        const ds = datasource || appConfig.defaultDataSourceName;
        navigate(
          `/${viewerMode}/${ds}?StudyInstanceUIDs=${studyInstanceUID}`,
          { replace: true }
        );
      } catch (err) {
        setError('Unable to connect to the share service.');
        setLoading(false);
      }
    }

    validateShare();
  }, [token, appConfig, navigate]);

  if (loading) {
    return (
      <div className="bg-black flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="text-primary mb-4 text-lg">Loading shared study...</div>
          <div className="text-muted-foreground text-sm">Validating share link</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg text-red-400">{error}</div>
          <a
            href="/"
            className="text-primary hover:underline"
          >
            Go to home
          </a>
        </div>
      </div>
    );
  }

  return null;
}

export default ShareView;
