let isExtensionLoaded = false;
let lastProductUrl = null;
let extensionIframe = null;

const getContainer = () => document.getElementById(containerId);

const toggleShowIframe = () => {
  if (!extensionIframe) {
    return;
  }

  const isActive = extensionIframe.classList.contains(activeClassName);

  const toggleActiveClass = isActive ? remove : add;
  const toggleInactiveClass = isActive ? add : remove;
  extensionIframe.classList[toggleActiveClass](activeClassName);
  extensionIframe.classList[toggleActiveClass](inClassName);
  extensionIframe.classList[toggleInactiveClass](inactiveClassName);

  setZIndex();
};

const showIframe = () => {
  if (!extensionIframe) {
    return;
  }

  if (!extensionIframe.classList.contains(activeClassName)) {
    extensionIframe.classList.add(activeClassName);
    extensionIframe.classList.add(inClassName);
    extensionIframe.classList.remove(inactiveClassName);
  }

  setZIndex();
};

const hideIframe = () => {
  if (!extensionIframe) {
    return;
  }

  if (extensionIframe.classList.contains(activeClassName)) {
    extensionIframe.classList.remove(activeClassName);
    extensionIframe.classList.remove(inClassName);
    extensionIframe.classList.add(inactiveClassName);
  }
};

const toggleExpandIframeWidth = isOpen => {
  if (!extensionIframe) {
    return;
  }

  const toggleExpandedClass = isOpen ? add : remove;

  extensionIframe.classList[toggleExpandedClass](expandedClassName);
};

const changeIframeStyle = (className, type) => {
  if (!extensionIframe) {
    return;
  }

  if (!extensionIframe.classList.contains(className) && type === AddClass) {
    extensionIframe.classList.add(className);
  }

  if (extensionIframe.classList.contains(className) && type === RemoveClass) {
    extensionIframe.classList.remove(className);
  }
}

const tryToScrapeData = async (url, retailer) => {
  let maxAttempts = 5;
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
      upc = getXPathContent(retailer?.selectors?.product?.upc).replace(/_~_/g,'').replace(/ /g,'');
      upc = RegUPC.test(upc) ? upc : '';
      sku = getXPathContent(retailer?.selectors?.product?.sku).replace(/_~_/g,'');

      if (title) {
        sendMessage(StartSpinExtensionIcon);
      }

      if (!!title
        && !!price
        && (!retailer?.selectors?.product?.upc
          || (retailer?.selectors?.product?.upc && !!upc))) {
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

    postMessage(TryToScrapeData, { product, retailer });
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
  extensionIframe.contentWindow.postMessage(
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
const addIframe = async () => {
  if (getContainer()) {
    return;
  }

  const container = document.createElement('div');
  container.id = containerId;

  const shadowRoot = container.attachShadow({mode: 'closed'});

  extensionIframe = document.createElement('iframe');
  extensionIframe.id = iframeID;
  extensionIframe.src = chrome.runtime.getURL('index.html');

  const style = document.createElement('style');
  style.innerHTML = await getFileContent(chrome.runtime.getURL('extension/content.css'));

  shadowRoot.append(style);
  shadowRoot.append(extensionIframe);
  document.documentElement.append(container);
};

const setZIndex = () => {
  const container = getContainer();

  if (!container) {
    return;
  }

  let nextElement = container.nextSibling;

  while (nextElement && nextElement.nodeType === Node.ELEMENT_NODE) {
    if (nextElement.style.zIndex === '2147483647') {
      nextElement.style.zIndex = '2147483646';
    }
    nextElement = nextElement.nextSibling;
  }

  const honeyContainer = document.querySelector('#honeyContainer');
  if (honeyContainer) {
    const honeyShadowRoot = honeyContainer.shadowRoot;
    honeyShadowRoot.querySelector('#honey-shadow').style.zIndex = '2147483646';
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

const init = async () => {
  await addIframe();
  setExtensionInstalled();
  initEvents();
}

init();