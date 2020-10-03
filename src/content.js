const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;

const iframeID = 'extension-iframe';
const activeClassName = 'active';
const inactiveClassName = 'inactive';
const inClassName = 'in';
const expandedClassName = 'expanded';
const remove = 'remove';
const add = 'add';

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

const tryToScrapeDataByVendor = (url, vendors = []) => {
  vendors.forEach(vendor => {
    if (url.includes(vendor.url)) {
      const productTitleElement = getElementBySelector(
        vendor.selectors.product.title,
      );
      const productPriceElement = getElementBySelector(
        vendor.selectors.product.price,
      );
      const productImageElement = getElementBySelector(
        vendor.selectors.product.image,
      );

      const shouldSaveProductToDB = !!productTitleElement;

      if (shouldSaveProductToDB) {
        const priceDivider = ' - ';
        const title = productTitleElement.innerText;
        const originalPrice = productPriceElement
          ? productPriceElement.innerText
          : '';
        const image = productImageElement ? productImageElement.src : '';

        const price = originalPrice.includes(priceDivider)
          ? getNumericPriceFromString(originalPrice.split(priceDivider)[0])
          : getNumericPriceFromString(originalPrice);

        const productData = {
          title,
          price,
          image,
          url,
          created: Date.now(),
        };

        const vendorsData = vendors.reduce((result, vendorItem) => {
          result[vendorItem.name] =
            vendorItem.name === vendor.name ? { ...productData } : false;
          return result;
        }, {});

        const product = {
          ...productData,
          ...vendorsData,
          vendor: vendor.name,
        };
        saveProductToDB(product);
      }
    }
  });
};

const saveProductToDB = product => {
  // TODO: remove when 174512601 is done
  console.info('--- content save-product-to-db ---');
  chrome.runtime.sendMessage({
    action: 'save-product-to-db',
    product,
  });
};

const getElementBySelector = (selector = '') => {
  return typeof selector === 'string'
    ? document.querySelector(selector)
    : Array.isArray(selector) &&
        selector
          .map(item => {
            return typeof item === 'string'
              ? document.querySelector(item)
              : null;
          })
          .filter(Boolean)[0];
};

const getNumericPriceFromString = (price = '') =>
  Number(price.replace(/[^0-9\.-]+/g, ''));

if (!location.ancestorOrigins.contains(extensionOrigin)) {
  const iframe = document.createElement('iframe');
  iframe.id = iframeID;
  // Must be declared at web_accessible_resources in manifest.json
  iframe.src = chrome.runtime.getURL('index.html');

  if (!inIframe()) {
    document.body.appendChild(iframe);
  }
}

chrome.extension.onMessage.addListener(function (msg) {
  switch (msg.action) {
    case 'toggle-show-iframe':
      toggleShowIframe();
      break;

    case 'show-iframe':
      showIframe();
      break;

    case 'hide-iframe':
      hideIframe();
      break;

    case 'toggle-expand-iframe-width':
      toggleExpandIframeWidth(msg.isOpen);
      break;

    case 'try-to-scrape-data':
      tryToScrapeDataByVendor(msg.url, msg.vendors);
      break;

    default:
      break;
  }
});

document.body.addEventListener('click', hideIframe);
