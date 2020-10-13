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
      // Scraping Product
      const productTitleElement = getElementBySelector(
        vendor.selectors.product.title,
      );
      const productPriceElement = getElementBySelector(
        vendor.selectors.product.price,
      );
      const productImageElement = getElementBySelector(
        vendor.selectors.product.image,
      );
      const vendorInnerCodeElement = getElementBySelector(
        vendor.selectors.product.innerCode.selector,
      );

      const shouldSaveProductToDB = !!productTitleElement;

      if (shouldSaveProductToDB) {
        const priceDivider = ' - ';
        const title = productTitleElement.innerText.trim();
        const originalPrice = productPriceElement
          ? productPriceElement.innerText.trim()
          : '';

        const image = productImageElement ? productImageElement.src : '';

        const price = originalPrice.includes(priceDivider)
          ? getNumberFromString(originalPrice.split(priceDivider)[0])
          : getNumberFromString(originalPrice);

        const vendorInnerCode = vendorInnerCodeElement
          ? getVendorInnerCode(
              vendorInnerCodeElement,
              vendor.selectors.product.innerCode,
            )
          : '';

        const productData = {
          title,
          image,
          price,
          url,
          vendorInnerCode,
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

      // Scraping Cart
      const cartItemsWrapper = getElementBySelector(
        vendor.selectors.cart.itemsWrapper,
      );
      const cartItems = getChildrenOfElementBySelector(
        cartItemsWrapper,
        vendor.selectors.cart.item,
      );
      const shouldScrapeCart =
        !!cartItemsWrapper && cartItems && !!cartItems.length;

      if (shouldScrapeCart) {
        const cartData = [...cartItems].reduce(
          (result, item) => {
            const itemTitle = getFirstChildOfElementBySelector(
              item,
              vendor.selectors.cart.itemTitle,
            );
            const title = itemTitle ? itemTitle.innerText.trim() : '';
            const itemImage = getFirstChildOfElementBySelector(
              item,
              vendor.selectors.cart.itemImage,
            );
            const image = itemImage
              ? itemImage.src
                ? itemImage.src.trim()
                : itemImage.srcset
                ? itemImage.srcset.trim()
                : ''
              : '';
            const itemQuantity = getFirstChildOfElementBySelector(
              item,
              vendor.selectors.cart.itemQuantity,
            );
            const quantity = itemQuantity
              ? getNumberFromString(itemQuantity.innerText.trim())
              : '';
            const itemPrice = getFirstChildOfElementBySelector(
              item,
              vendor.selectors.cart.itemPrice,
            );
            const price = itemPrice
              ? getNumberFromString(itemPrice.innerText.trim())
              : '';
            const vendorInnerCode = getVendorInnerCode(
              item,
              vendor.selectors.cart.innerCode,
            );

            if (!result.totalPrice) {
              const totalPriceElement = getElementBySelector(
                vendor.selectors.cart.totalPrice,
              );
              const totalPrice = totalPriceElement
                ? getNumberFromString(totalPriceElement.innerHTML.trim())
                : 0;

              result.totalPrice = totalPrice;
            }

            result.items.push({
              title,
              image,
              quantity,
              price,
              vendorInnerCode,
            });
            result.totalQuantity = +result.totalQuantity + +quantity;
            return result;
          },
          { items: [], totalQuantity: 0, totalPrice: 0 },
        );

        const cart = {
          ...cartData,
          created: Date.now(),
          vendor: vendor.name,
        };

        if (!!cart.items.length) {
          saveCartToDB(cart);
        }
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

const saveCartToDB = cart => {
  chrome.runtime.sendMessage({
    action: 'save-cart-to-db',
    cart,
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

const getChildrenOfElementBySelector = (element = Element, selector = '') => {
  if (!element || typeof element.querySelectorAll !== 'function') {
    return element;
  }
  return typeof selector === 'string'
    ? element.querySelectorAll(selector)
    : Array.isArray(selector) &&
        selector
          .map(item => {
            return typeof item === 'string'
              ? element.querySelectorAll(item)
              : null;
          })
          .filter(list => !!list.length)[0];
};

const getFirstChildOfElementBySelector = (element = Element, selector = '') => {
  if (!element || typeof element.querySelector !== 'function') {
    return element;
  }
  return typeof selector === 'string'
    ? element.querySelector(selector)
    : Array.isArray(selector) &&
        selector
          .map(item => {
            return typeof item === 'string'
              ? element.querySelector(item)
              : null;
          })
          .filter(Boolean)[0];
};

const getVendorInnerCode = (product = Element, innerCode = {}) => {
  if (innerCode.attribute === 'dataset' && !innerCode.selector) {
    return product[innerCode.attribute][innerCode.name];
  }

  if (innerCode.attribute === 'dataset' && innerCode.selector) {
    const element = getChildrenOfElementBySelector(product, innerCode.selector);
    return element && element[0]
      ? element[0][innerCode.attribute][innerCode.name]
      : '';
  }

  if (innerCode.attribute === 'regex') {
    const regex = new RegExp(innerCode.regex, 'ig');
    const foundData = product.innerText.match(regex);
    return foundData && Array.isArray(foundData) && foundData[0]
      ? foundData[0].replace(innerCode.replace, '')
      : '';
  }

  return product[innerCode.attribute];
};

const getNumberFromString = (price = '') =>
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
