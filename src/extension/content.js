let isExtensionLoaded = false;
let lastProductUrl = null;

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

const changeIframeStyle = (className, type) => {
  const iframe = getIframe();

  if (!iframe) {
    return;
  }

  if (!iframe.classList.contains(className) && type === AddClass) {
    iframe.classList.add(className);
  }

  if (iframe.classList.contains(className) && type === RemoveClass) {
    iframe.classList.remove(className);
  }
}

const tryToScrapeData = async (url, retailer) => {
  let maxAttempts = 15;
  let product = null;
  let title = null;
  let price = null;
  let image = null;
  let upc = null;
  let sku = null;

  try {
    while (maxAttempts > 0) {
      title = getXPathContent(retailer?.selectors?.product?.title)
      .trim()
      .replace(/(\r\n|\n|\r)/gm, ' ');
      const priceDivider = ' - ';
      const originalPrice = getXPathContent(retailer?.selectors?.product?.price).trim();
      price = originalPrice.includes(priceDivider)
        ? getNumberFromString(originalPrice.split(priceDivider)[0])
        : getNumberFromString(originalPrice);
      image = getXPathContent(retailer?.selectors?.product?.image);
      upc = getXPathContent(retailer?.selectors?.product?.upc).replace(/_~_/g,'');
      sku = getXPathContent(retailer?.selectors?.product?.sku).replace(/_~_/g,'');

      if (!!title && !!price) {
        break;
      }

      maxAttempts--;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!!title) {
      product = {
        title,
        upc,
        image,
        price,
        url,
        created: Date.now(),
        sku,
        retailer: retailer.name,
      };

      if (!price) {
        sendMessage(LogError,
          `URL: ${url} <br>
          Title: ${title} <br>
          Price: ${price} <br>`
        );
      }
    }

    postMessage(TryToScrapeData, { product });
  } catch(e) {
    console.log('tryToScrapeData=================', e);
    sendMessage(LogError, `URL: ${url} <br> ${e.message}`);
    postMessage(TryToScrapeData, { product });
  }
};

const sendMessage = (action, data, cb = null) => {
  chrome.runtime.sendMessage(
    {
      action,
      data,
    },
    cb,
  );
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

const getUserId = () => {
  const interval = setInterval(() => {
    if (isExtensionLoaded) {
      postMessage(GetUserId);
      clearInterval(interval);
    }
  }, 50);
}

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
  const interval = setInterval(() => {
    if (isExtensionLoaded) {
      postMessage(SetUserId, { uid: data.detail });
      clearInterval(interval);
    }
  }, 50);
};

const openDemoProduct = data => {
  sendMessage(OpenDemoProduct, data.detail);
}

/**
 * Handle messages from background script and iframe
 * @param {string} msg
 */
const handleMessage = (msg, sender, sendResponse) => {
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
      toggleExpandIframeWidth(msg.data.isOpen);
      break;

    case ChangeIframeStyle:
      changeIframeStyle(msg.data.class, msg.data.type);
      break;

    case TryToScrapeData:
      tryToScrapeData(msg.data.url, msg.data.retailer);
      break;

    case SiteForceLogin:
      dispatchSiteLogin(msg.data.uid);
      break;

    case SiteForceLogout:
      dispatchSiteLogout();
      break;

    case TabUpdated:
      if (lastProductUrl !== location.href) {
        postMessage(GetProductURL, { productUrl: location.href });
        lastProductUrl = location.href;
      }
      break;

    case ExtensionHomeLoaded:
      lastProductUrl = location.href;
      postMessage(GetProductURL, { productUrl: location.href });
      break;

    case ExtensionLoaded:
      isExtensionLoaded = true;
      break;

    default:
      break;
  }
};

const postMessage = (action, data) => {
  const iframe = getIframe();
  iframe.contentWindow.postMessage(
    {
      action,
      data,
    },
    '*'
  );
}

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
    }

    const extensionIframe = getIframe();
    if (extensionIframe.getAttribute("src") !== chrome.runtime.getURL('index.html')) {
      extensionIframe.src = chrome.runtime.getURL('index.html');
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
  document.body.addEventListener('click', hideIframe);
  window.addEventListener(SetUserId, setUserId);
  window.addEventListener(GetUserId, getUserId);
  window.addEventListener(OpenDemoProduct, openDemoProduct);
  chrome.extension.onMessage.addListener(handleMessage);
  window.addEventListener('message', (e) => {
    handleMessage(e.data);
  });
};

const init = () => {
  if (!location.ancestorOrigins.contains(extensionOrigin) && !inIframe()) {
    addIframe();
    setExtensionInstalled();
    initEvents();

    // Homedepot prevent injecting iframe
    // Cause of this reason, replace site original iframe with extension iframe
    if (location.href.includes('www.homedepot.com')) {
      replaceIframe();
    }
  }
}

init();