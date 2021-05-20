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
        vendor?.selectors?.product?.title,
      );

      if (!!productTitleElement) {
        const productPriceElement = getElementBySelector(
          vendor?.selectors?.product?.price,
        );

        const priceDivider = ' - ';
        const title = productTitleElement.innerText.trim().replace(/(\r\n|\n|\r)/gm, ' ');
        const originalPrice = productPriceElement
          ? productPriceElement.innerText.trim()
          : '';

        const price = originalPrice.includes(priceDivider)
          ? getNumberFromString(originalPrice.split(priceDivider)[0])
          : getNumberFromString(originalPrice);

        const productImageElement = getElementBySelector(
          vendor?.selectors?.product?.image,
        );

        const image = productImageElement ? productImageElement.src : '';

        const brandItem = getElementBySelector(
          vendor?.selectors?.product?.brand?.selector,
        );

        const brand = getAttribute(
          brandItem,
          vendor?.selectors?.product?.brand,
        );

        const manufacturerItem = getElementBySelector(
          vendor?.selectors?.product?.manufacturer?.selector,
        );

        const manufacturer = getAttribute(
          manufacturerItem,
          vendor?.selectors?.product?.manufacturer,
        );

        const vendorInnerCodeElement = getElementBySelector(
          vendor?.selectors?.product?.innerCode?.selector,
        );

        const vendorInnerCode = vendorInnerCodeElement
          ? getVendorInnerCode(
              vendorInnerCodeElement,
              vendor?.selectors?.product?.innerCode,
            )
          : '';

        const productData = {
          title,
          image,
          price,
          brand,
          manufacturer,
          vendorInnerCode,
          url,
          created: Date.now(),
        };

        const product = {
          ...productData,
          vendor: vendor.name,
        };

        saveProductToDB(product);
        sendMessage(PerformGoogleSearch, product);
      }

      // Scraping Cart
      const cartItemsWrapper = getElementBySelector(
        vendor?.selectors?.cart?.itemsWrapper,
      );
      const cartItems = getDescendantsOfElementBySelector(
        cartItemsWrapper,
        vendor?.selectors?.cart?.item,
      );
      const shouldScrapeCart =
        !!cartItemsWrapper && cartItems && !!cartItems.length;

      if (shouldScrapeCart) {
        const cartData = [...cartItems].reduce(
          (result, item) => {
            const itemTitle = getFirstDescendantOfElementBySelector(
              item,
              vendor?.selectors?.cart?.itemTitle,
            );
            const title = itemTitle ? itemTitle.innerText.trim() : '';
            const itemImage = getFirstDescendantOfElementBySelector(
              item,
              vendor?.selectors?.cart?.itemImage,
            );
            const image = itemImage
              ? itemImage.src
                ? itemImage.src.trim()
                : itemImage.srcset
                ? itemImage.srcset.trim()
                : ''
              : '';
            const itemQuantity = getFirstDescendantOfElementBySelector(
              item,
              vendor?.selectors?.cart?.itemQuantity,
            );
            const quantity = itemQuantity
              ? getNumberFromString(itemQuantity.innerText.trim())
              : '';
            const itemPrice = getFirstDescendantOfElementBySelector(
              item,
              vendor?.selectors?.cart?.itemPrice,
            );
            const price = itemPrice
              ? getNumberFromString(itemPrice.innerText.trim())
              : '';
            const vendorInnerCode = getVendorInnerCode(
              item,
              vendor?.selectors?.cart?.innerCode,
            );

            if (!result.totalPrice) {
              const totalPriceElement = getElementBySelector(
                vendor?.selectors?.cart?.totalPrice,
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

      // Scraping Baby Registry List
      const babyRegistryListTriggerContainer = getElementBySelector(
        vendor?.selectors?.registries?.baby?.list?.triggers?.container,
      );

      const shouldRunBabyRegistryListTrigger = !!babyRegistryListTriggerContainer;

      if (shouldRunBabyRegistryListTrigger) {
        const config = { attributes: false, childList: true, subtree: true };

        const callback = function () {
          const babyRegistryListItems = getDescendantsOfElementBySelector(
            babyRegistryListTriggerContainer,
            vendor?.selectors?.registries?.baby?.list?.item,
          );

          const shouldScrapeBabyRegistryList =
            !!babyRegistryListItems && !!babyRegistryListItems.length;

          if (shouldScrapeBabyRegistryList) {
            const babyRegistryListData = [...babyRegistryListItems].reduce(
              (result, item) => {
                const itemName = getFirstDescendantOfElementBySelector(
                  item,
                  vendor?.selectors?.registries?.baby?.list?.name,
                );
                const name = itemName ? itemName.innerText.trim() : '';

                const itemLocation = getFirstDescendantOfElementBySelector(
                  item,
                  vendor?.selectors?.registries?.baby?.list?.location,
                );
                const location = itemLocation
                  ? itemLocation.innerText.trim()
                  : '';

                const itemDate = getFirstDescendantOfElementBySelector(
                  item,
                  vendor?.selectors?.registries?.baby?.list?.date,
                );
                const date = itemDate ? itemDate.innerText.trim() : '';

                const itemUrl = item.hasAttribute(
                  vendor?.selectors?.registries?.baby?.list?.url?.attribute,
                )
                  ? item
                  : getFirstDescendantOfElementBySelector(
                      item,
                      vendor?.selectors?.registries?.baby?.list?.url?.selector,
                    );

                const url = getUrl(
                  itemUrl,
                  vendor?.selectors?.registries?.baby?.list?.url,
                );

                const id = getRegistryId(
                  url,
                  vendor?.selectors?.registries?.baby?.list?.url?.index,
                  vendor?.selectors?.registries?.baby?.list?.url?.divider,
                );

                result.push({
                  name,
                  location,
                  date,
                  url,
                  id,
                  created: Date.now(),
                  updated: 0,
                  type: baby,
                  vendor: vendor.name,
                  scraped: false,
                });
                return result;
              },
              [],
            );

            if (!!babyRegistryListData.length) {
              saveRegistryToDB(babyRegistryListData);
            }
          }
        };

        const observer = new MutationObserver(callback);

        observer.observe(babyRegistryListTriggerContainer, config);
      }

      // Scraping Baby Registry List Item
      const babyRegistryResultTriggerContainer =
        vendor?.selectors?.registries?.baby?.result?.triggers &&
        vendor?.selectors?.registries?.baby?.result?.triggers?.container &&
        getElementBySelector(
          vendor?.selectors?.registries?.baby?.result?.triggers?.container,
        );

      const shouldRunBabyRegistryResultTrigger = !!babyRegistryResultTriggerContainer;

      const babyRegistryResultCallback = function () {
        const babyRegistryListItemsWrapper = getElementBySelector(
          vendor?.selectors?.registries?.baby?.result?.itemsWrapper,
        );
        const babyRegistryListItems = getDescendantsOfElementBySelector(
          babyRegistryListItemsWrapper,
          vendor?.selectors?.registries?.baby?.result?.item,
        );
        const shouldScrapeBabyRegistryListItems =
          !!babyRegistryListItemsWrapper &&
          !!babyRegistryListItems &&
          !!babyRegistryListItems.length;

        if (shouldScrapeBabyRegistryListItems) {
          const registryId = getRegistryId(
            document.location.href,
            vendor?.selectors?.registries?.baby?.result?.registryId?.index,
          );

          const babyRegistryResultData = [...babyRegistryListItems]
            .reduce((result, item) => {
              const itemTitle = getFirstDescendantOfElementBySelector(
                item,
                vendor?.selectors?.registries?.baby?.result?.itemTitle,
              );
              const title = itemTitle ? itemTitle.innerText.trim() : '';

              const priceDivider = ' - ';
              const itemPrice = getFirstDescendantOfElementBySelector(
                item,
                vendor?.selectors?.registries?.baby?.result?.itemPrice,
              );
              const originalPrice = itemPrice ? itemPrice.innerText.trim() : '';
              const price = originalPrice.includes(priceDivider)
                ? getNumberFromString(originalPrice.split(priceDivider)[0])
                : getNumberFromString(originalPrice);

              const itemPurchased = getFirstDescendantOfElementBySelector(
                item,
                vendor?.selectors?.registries?.baby?.result?.itemPurchased,
              );

              const purchased = getInfoAboutPurchasedItems(
                itemPurchased ? itemPurchased.innerText.trim() : '',
                vendor?.selectors?.registries?.baby?.result?.itemPurchasedText,
              );

              const ratingItem = getFirstDescendantOfElementBySelector(
                item,
                vendor?.selectors?.registries?.baby?.result?.itemRating
                  ?.selector,
              );

              const rating = getNumericRating(
                ratingItem
                  ? ratingItem.getAttribute(
                      vendor?.selectors?.registries?.baby?.result?.itemRating
                        ?.attribute,
                    )
                  : '',
                vendor?.selectors?.registries?.baby?.result?.itemRating?.regex,
              );

              const reviewsItem = getFirstDescendantOfElementBySelector(
                item,
                vendor?.selectors?.registries?.baby?.result?.itemReviews,
              );

              const reviews = getNumberFromString(
                reviewsItem ? reviewsItem.innerText.trim() : '',
              );

              const categoryItemClosest = item.closest(
                vendor?.selectors?.registries.baby.result.itemCategory,
              );
              const categoryItemSiblings = getPreviousSiblings(item) || [];

              const categoryItem =
                categoryItemClosest ||
                categoryItemSiblings.filter(sibling =>
                  sibling.matches(
                    vendor?.selectors?.registries?.baby?.result?.itemCategory,
                  ),
                )[0];

              const category = categoryItem
                ? categoryItem.innerText.trim()
                : '';

              const vendorInnerCode = getVendorInnerCode(
                item,
                vendor?.selectors?.registries?.baby?.result?.innerCode,
              );

              const itemUrl = item.hasAttribute(
                vendor?.selectors?.registries?.baby?.result?.itemUrl?.attribute,
              )
                ? item
                : getFirstDescendantOfElementBySelector(
                    item,
                    vendor?.selectors?.registries?.baby?.result?.itemUrl
                      ?.selector,
                  );

              const url = itemUrl
                ? getUrl(
                    itemUrl,
                    vendor?.selectors?.registries?.baby?.result?.itemUrl,
                  )
                : '';

              result.push({
                category,
                title,
                price,
                purchased,
                rating,
                reviews,
                vendorInnerCode,
                url,
              });
              return result;
            }, [])
            .filter(item => !!item.vendorInnerCode || !!item.url);

          const data = {
            id: registryId,
            itemsQuantity: babyRegistryResultData.length,
          };

          const dataWithItems = babyRegistryResultData.length
            ? {
                ...data,
                items: babyRegistryResultData,
              }
            : data;

          saveRegistryResultToDB(dataWithItems);
        }
      };

      if (shouldRunBabyRegistryResultTrigger) {
        const config = { attributes: false, childList: true, subtree: true };

        const observer = new MutationObserver(babyRegistryResultCallback);

        observer.observe(babyRegistryResultTriggerContainer, config);
      } else {
        babyRegistryResultCallback();
      }
    }
  });
};

const saveProductToDB = product => {
  chrome.runtime.sendMessage({
    action: 'save-product-to-db',
    product,
  });
};

const sendMessage = (action, data) => {
  chrome.runtime.sendMessage({
    action,
    data,
  });
}

const saveCartToDB = cart => {
  chrome.runtime.sendMessage({
    action: 'save-cart-to-db',
    cart,
  });
};

const saveRegistryToDB = items => {
  chrome.runtime.sendMessage({
    action: 'save-registry-list-to-db',
    items,
  });
};

const saveRegistryResultToDB = (data = {}) => {
  chrome.runtime.sendMessage({
    action: 'save-registry-result-to-db',
    ...data,
  });
};

const getVendorInnerCode = (product = Element, innerCode = {}) => {
  if (innerCode.attribute === 'regex') {
    const regex = new RegExp(innerCode.regex, 'igm');
    const found = regex.exec(product.innerText);
    return found && found.groups && found.groups.vendorInnerCode
      ? found.groups.vendorInnerCode
      : '';
  }

  if (innerCode.selector) {
    const element = getDescendantsOfElementBySelector(
      product,
      innerCode.selector,
    );
    return element && element[0]
      ? innerCode.subattribute
        ? JSON.parse(element[0].getAttribute(innerCode.attribute))[
            innerCode.subattribute
          ]
        : element[0].getAttribute(innerCode.attribute)
      : product.getAttribute(innerCode.attribute) || '';
  }

  return Array.isArray(innerCode.attribute)
    ? innerCode.attribute.filter(attribute =>
        product.getAttribute(attribute),
      )[0]
    : product.getAttribute(innerCode.attribute) || '';
};

const getUrl = (product = Element, itemUrl = {}) => {
  const getParsedSubAttribute = data => {
    const parsedData = JSON.parse(data);
    return parsedData && parsedData[itemUrl.subattribute]
      ? parsedData[itemUrl.subattribute]
      : '';
  };

  const getParsedUrl = url => {
    if (!url) {
      return '';
    }

    const regex = /^document.location.href='(.*)'/;
    const matches = url.match(regex);
    const origin = window.location.origin;

    if (url.includes('document.location.href=')) {
      return matches[1].includes(origin)
        ? matches[1]
        : `${origin}${matches[1]}`;
    }
    return url.startsWith(origin) ? url : `${origin}${url}`;
  };

  if (itemUrl.selector) {
    const element = product.hasAttribute(itemUrl.attribute)
      ? product
      : getDescendantsOfElementBySelector(product, itemUrl.selector);

    const found = element || element[0];

    const originalUrl = found
      ? itemUrl.subattribute
        ? getParsedSubAttribute(found.getAttribute(itemUrl.attribute))
        : found.getAttribute(itemUrl.attribute)
      : itemUrl.subattribute
      ? getParsedSubAttribute(product.getAttribute(itemUrl.attribute))
      : '';

    return getParsedUrl(originalUrl);
  }

  return Array.isArray(itemUrl.attribute)
    ? itemUrl.attribute.filter(attribute => product.getAttribute(attribute))[0]
    : product.getAttribute(itemUrl.attribute);
};

const getRegistryId = (url = '', index = 0, divider = '/') => {
  const urlAsArray = url.split(divider);
  return Array.isArray(urlAsArray) ? urlAsArray[index] || '' : '';
};

const getInfoAboutPurchasedItems = (text = '', alreadyPurchasedText) => {
  const regex = /[^\d]*(\d*)[^\d]*(\d*)[^\d]*/;
  const matches = text.match(regex);
  const defaultResult = {};
  return Array.isArray(matches)
    ? matches.filter(Boolean).reduce((result, item, index) => {
        if (index === 0 && item === alreadyPurchasedText) {
          result = {
            purchased: 1,
            total: 1,
            remaining: 0,
          };
        }
        if (index === 1) {
          result.purchased = +item;
        }
        if (index === 2) {
          result.total = +item;
          result.remaining = result.total - result.purchased;
        }
        return result;
      }, defaultResult)
    : defaultResult;
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
  const iframe = document.createElement('iframe');
  iframe.id = iframeID;
  iframe.src = chrome.runtime.getURL('index.html');
  document.body.appendChild(iframe);
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
