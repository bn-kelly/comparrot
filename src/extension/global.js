/**
 * Return active tab
 */
const getActiveTab = async () => {
  return new Promise(resolve => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      tabs => {
        resolve(tabs[0]);
      },
    );
  });
};

const getXPathString = (doc, xpath) => {
  if (xpath === undefined || xpath === '') return '';
  xpath = 'normalize-space(' + xpath + ')';
  const result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
  return clean(result.stringValue);
}

const getXPathArray = (doc, xpath) => {
  if (xpath === undefined || xpath === '') return '';
  const result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
  return result;
}

const getElementBySelector = (selector = '') => {
  if (!selector || selector === '') {
    return selector;
  }

  return typeof selector === 'string'
    ? document.querySelector(selector)
    : Array.isArray(selector) &&
        selector
          .map(item => {
            return typeof item === 'string' && item !== ''
              ? document.querySelector(item)
              : null;
          })
          .filter(Boolean)[0];
};

const getDescendantsOfElementBySelector = (
  element = Element,
  selector = '',
) => {
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

const getFirstDescendantOfElementBySelector = (
  element = Element,
  selector = '',
) => {
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

const getPreviousSiblings = elem => {
  const siblings = [];

  while ((elem = elem.previousElementSibling)) {
    siblings.push(elem);
  }
  return siblings;
};

const getAttribute = (element = Element, data = {}) => {
  if (!element) {
    return '';
  }

  if (!!data.attribute && data.attribute === 'regex') {
    const regexRule = 'igm';
    if (typeof data.regex === 'string') {
      const regex = new RegExp(data.regex, regexRule);
      const found = regex.exec(element.innerText);
      return found && found.groups ? found.groups.value : '';
    } else {
      return data.regex.reduce((result, item) => {
        const regex = new RegExp(item, regexRule);
        const found = regex.exec(element.innerText);
        if (found && found.groups && found.groups.value) {
          result = found.groups.value;
        }
        return result;
      }, '');
    }
  }

  if (data.selector && !!data.attribute && data.attribute !== 'regex') {
    const element = getDescendantsOfElementBySelector(element, data.selector);

    return element && element[0] ? element[0].getAttribute(data.attribute) : '';
  }

  return element.innerText || '';
};

const getNumericRating = (text = '', regex = new RegExp('')) => {
  const matches = text.match(regex);
  const defaultResult = 0;
  return Array.isArray(matches)
    ? matches.filter(Boolean).reduce((result, item, index) => {
        if (index === 1) {
          result = +item;
        }
        if (index === 2) {
          result = Number(`${result}.${item}`);
        }

        return result;
      }, defaultResult)
    : defaultResult;
};

const getNumberFromString = (price = '') =>
  Number(price.replace(/[^0-9\.-]+/g, '')) || 0;

/**
 * Trip spaces and remove html entities
 * @param {string} str 
 */
const clean = (str) => {
  return str ? str.replace(/&nbsp;/g, '').replace(/&amp;/g, '').replace(/^\s+|\s+$/g, "") : '';
}

const extractGUrl = (url) => {
  const vars = {};
  url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    vars[key] = value;
  });

  // adurl exists
  if (!(undefined === vars['adurl'])) {
      // adurl is empty
      if(vars["adurl"] === '') {
          return url;
      // adurl exists so let's return it
      } else {
          return vars['adurl'];
      }
  }

  return url;
}

const getDocFromUrl = async (url) => {
  const response = await fetch(url);
  const responseText = await response.text();
  const doc = document.implementation.createHTMLDocument('');
  doc.documentElement.innerHTML = DOMPurify.sanitize(responseText);
  return doc;
}

const setStorageValue = (data) => {
  chrome.storage.local.set(data);
}

const getStorageValue = (key) => {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      resolve(result[key]);
    });
  });
}