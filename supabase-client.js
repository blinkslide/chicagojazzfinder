(function() {
  function getConfig() {
    return window.CHICAGO_JAZZ_SUPABASE_CONFIG || null;
  }

  function hasConfig() {
    var config = getConfig();
    return !!(config && config.url && config.anonKey &&
      config.url !== "https://YOUR-PROJECT.supabase.co" &&
      config.anonKey !== "YOUR-ANON-KEY");
  }

  function getConfigError() {
    if (!window.supabase || !window.supabase.createClient) {
      return "Supabase library did not load";
    }
    if (!hasConfig()) {
      return "Supabase is not configured yet";
    }
    return "";
  }

  var client = null;

  function getClient() {
    if (client) return client;
    if (getConfigError()) return null;
    var config = getConfig();
    client = window.supabase.createClient(config.url, config.anonKey);
    return client;
  }

  function getSubmissionsTable() {
    var config = getConfig();
    return (config && config.submissionsTable) || "submissions";
  }

  window.CJFSupabase = {
    getConfig: getConfig,
    hasConfig: hasConfig,
    getConfigError: getConfigError,
    getClient: getClient,
    getSubmissionsTable: getSubmissionsTable
  };
})();
