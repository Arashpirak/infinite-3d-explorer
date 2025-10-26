(function() {
  // Configuration
  const config = {
    // Default settings
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    theme: 'default', // 'default', 'dark', 'light'
    language: 'fa', // 'fa' (Persian), 'en' (English)
    apiUrl: null, // Will be auto-detected if not provided
    apiKey: null, // API key for authentication
    customIcon: null, // Custom icon URL
    customTitle: null, // Custom title
    customSubtitle: null, // Custom subtitle
    debug: false // Enable debug mode
  };

  // Get script configuration from data attributes
  const thisScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  if (thisScript) {
    // Override config with data attributes
    if (thisScript.dataset.position) config.position = thisScript.dataset.position;
    if (thisScript.dataset.theme) config.theme = thisScript.dataset.theme;
    if (thisScript.dataset.language) config.language = thisScript.dataset.language;
    if (thisScript.dataset.apiUrl) config.apiUrl = thisScript.dataset.apiUrl;
    if (thisScript.dataset.apiKey) config.apiKey = thisScript.dataset.apiKey;
    if (thisScript.dataset.customIcon) config.customIcon = thisScript.dataset.customIcon;
    if (thisScript.dataset.customTitle) config.customTitle = thisScript.dataset.customTitle;
    if (thisScript.dataset.customSubtitle) config.customSubtitle = thisScript.dataset.customSubtitle;
    if (thisScript.dataset.debug === 'true') config.debug = true;
  }

  // Determine the base origin
  let baseOrigin;
  if (config.apiUrl) {
    baseOrigin = config.apiUrl;
  } else {
    try {
      const url = new URL(thisScript && thisScript.src ? thisScript.src : window.location.href);
      baseOrigin = url.origin;
    } catch (e) {
      baseOrigin = window.location.origin;
    }
  }

  // Create the widget script element
  const widgetScript = document.createElement('script');
  widgetScript.src = baseOrigin + '/dist2/chatbot-widget.js';
  widgetScript.async = true;
  widgetScript.defer = true;

  // Add configuration to the script
  widgetScript.setAttribute('data-config', JSON.stringify(config));
  widgetScript.setAttribute('data-api-key', config.apiKey || '');

  // Add to page
  document.head.appendChild(widgetScript);

  // Log success
  if (config.debug) {
    console.log('🤖 Chatbot widget embed script loaded with config:', config);
  }
})();
