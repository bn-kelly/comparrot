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

const getXPathContent = (xpath) => {
  if (xpath === undefined || xpath.length === 0) return '';

  const xpaths = Array.isArray(xpath) ? xpath : [ xpath ];
  for (let xpath of xpaths) {
    xpath = "normalize-space(" + xpath + ")";
    const result = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    const value = clean(result.stringValue);
    
    if (value !== '') {
      return value;
    }
  }

  return '';
}

const clean = (str) => {
  return str
    ? str
        .replace(/&nbsp;/g, '')
        .replace(/&amp;/g, '')
        .replace(/^\s+|\s+$/g, '')
    : '';
}

const getNumberFromString = (price = '') => {
  const regex = /([0-9]*[.])?[0-9]+/g;
  const m = regex.exec(price);
  return m
    ? Number(m[0])
    : 0;
}

const setStorageValue = data => {
  chrome.storage.local.set(data);
};

const getStorageValue = key => {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      resolve(result[key]);
    });
  });
};
