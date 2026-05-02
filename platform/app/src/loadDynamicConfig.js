export default async config => {
  const useDynamicConfig = config.dangerouslyUseDynamicConfig;

  // Check if dangerouslyUseDynamicConfig enabled
  if (useDynamicConfig?.enabled) {
    // If enabled then get configUrl query-string
    let query = new URLSearchParams(window.location.search);
    let configUrl = query.get('configUrl');

    if (configUrl) {
      // validate regex
      const regex = useDynamicConfig.regex;

      if (configUrl.match(regex)) {
        const response = await fetch(configUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'same-origin',
          redirect: 'error',
          referrerPolicy: 'no-referrer',
        });

        if (!response.ok) {
          throw new Error(`Dynamic config fetch failed: ${response.status}`);
        }

        return response.json();
      } else {
        return null;
      }
    }
  }
  return null;
};
