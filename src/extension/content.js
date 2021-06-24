const getIframe = () => document.getElementById(iframeID);

const inIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

const toggleShowIframe = () => {
  const iframe = getIframe();

  if (!iframe) {
    return;
  }

  const isActive = iframe.classList.contains(activeClassName);

  const toggleActiveClass = isActive ? remove : add;
  const toggleInactiveClass = isActive ? add : remove;
  iframe.classList[toggleActiveClass](activeClassName);
  iframe.classList[toggleActiveClass](inClassName);
  iframe.classList[toggleInactiveClass](inactiveClassName);

  setZIndex();
};

const showIframe = () => {
  const iframe = getIframe();

  if (!iframe) {
    return;
  }

  if (!iframe.classList.contains(activeClassName)) {
    iframe.classList.add(activeClassName);
    iframe.classList.add(inClassName);
    iframe.classList.remove(inactiveClassName);
  }

  setZIndex();
};

const hideIframe = () => {
  const iframe = getIframe();

  if (!iframe) {
    return;
  }

  if (iframe.classList.contains(activeClassName)) {
    iframe.classList.remove(activeClassName);
    iframe.classList.remove(inClassName);
    iframe.classList.add(inactiveClassName);
  }
};

const toggleExpandIframeWidth = isOpen => {
  const iframe = getIframe();

  if (!iframe) {
    return;
  }

  const toggleExpandedClass = isOpen ? add : remove;

  iframe.classList[toggleExpandedClass](expandedClassName);
};

const tryToScrapeDataByVendor = (url, retailers = []) => {
  retailers.forEach(retailer => {
    if (url.includes(retailer.url)) {
      const title = getXPathContent(retailer?.selectors?.product?.title)
        .trim()
        .replace(/(\r\n|\n|\r)/gm, ' ');

      if (!!title) {
        const priceDivider = ' - ';
        const originalPrice = getXPathContent(retailer?.selectors?.product?.price).trim();
        const price = originalPrice.includes(priceDivider)
          ? getNumberFromString(originalPrice.split(priceDivider)[0])
          : getNumberFromString(originalPrice);
        const image = getXPathContent(retailer?.selectors?.product?.image);
        const upc = getXPathContent(retailer?.selectors?.product?.upc);
        const sku = getXPathContent(retailer?.selectors?.product?.sku) || url;
        const product = {
          title,
          upc,
          image,
          price,
          url,
          created: Date.now(),
          sku,
          retailer: retailer.name,
        };

        sendMessage(PerformGoogleSearch, product);
      }
    }
  });
};

const sendMessage = (action, data) => {
  chrome.runtime.sendMessage({
    action,
    data,
  });
};

/**
 * Dispatch an event to make site to login
 * @param {string} uid
 */
const dispatchSiteLogin = uid => {
  postMessageToSite(SiteForceLogin, uid);
};

/**
 * Dispatch an event to make site to logout
 */
const dispatchSiteLogout = () => {
  postMessageToSite(SiteForceLogout);
};

/**
 * Dispatch an event to site
 * @param {string} message
 * @param {any} data
 */
const postMessageToSite = (message, data = null) => {
  const event = new CustomEvent(message, { detail: data });
  return window.dispatchEvent(event);
};

/**
 * Send a message to chrome extension to set user id
 */
const setUserId = data => {
  chrome.runtime.sendMessage({
    action: SetUserId,
    uid: data.detail,
  });
};

/**
 * Handle messages from background script and iframe
 * @param {string} msg
 */
const handleMessage = msg => {
  switch (msg.action) {
    case ToggleShowIframe:
      toggleShowIframe();
      break;

    case ShowIframe:
      showIframe();
      break;

    case HideIframe:
      hideIframe();
      break;

    case ToggleExpandIframeWidth:
      toggleExpandIframeWidth(msg.isOpen);
      break;

    case TryToScrapeData:
      tryToScrapeDataByVendor(msg.url, msg.retailers);
      break;

    case SiteForceLogin:
      dispatchSiteLogin(msg.uid);
      break;

    case SiteForceLogout:
      dispatchSiteLogout();
      break;

    default:
      break;
  }
};

/**
 * Create an iframe to show the extension UI
 */
const addIframe = () => {
  if (getIframe()) {
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.id = iframeID;
  iframe.src = chrome.runtime.getURL('index.html');
  document.documentElement.appendChild(iframe);
};

/**
 * Replace an iframe to show the extension UI
 */
const replaceIframe = () => {
  const observer = new MutationObserver(() => {
    const iframe = document.querySelector('#minicartIFrame');
    if (iframe) {
      iframe.id = iframeID;
      iframe.src = chrome.runtime.getURL('index.html');
      observer.disconnect();
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
};

const setZIndex = () => {
  const iframe = getIframe();
  let nextElement = iframe.nextSibling;

  while (nextElement && nextElement.nodeType === Node.ELEMENT_NODE) {
    if (nextElement.style.zIndex === '2147483647') {
      nextElement.style.zIndex = '2147483646';
    }
    nextElement = nextElement.nextSibling;
  }
}

/**
 * Initialize event handlers
 */
const initEvents = () => {
  chrome.extension.onMessage.addListener(handleMessage);
  document.body.addEventListener('click', hideIframe);
  window.addEventListener(SetUserId, setUserId);
};

if (!location.ancestorOrigins.contains(extensionOrigin) && !inIframe()) {
  addIframe();
  initEvents();

  // Homedepot prevent injecting iframe
  // Cause of this reason, replace site original iframe with extension iframe
  if (location.href.includes('www.homedepot.com')) {
    replaceIframe();
  }
}
