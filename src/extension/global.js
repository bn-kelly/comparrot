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

function getXPathContent(xpath) {
  if (xpath === undefined || xpath.length === 0) return "";
  if (Array.isArray(xpath)) {
    xpath = xpath[0];
  }

  var xpath = "normalize-space(" + xpath + ")";
  var doc = document;
  var result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
  return clean(result.stringValue);
}

function clean(str) {
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
