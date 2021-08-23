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
  const m = regex.exec(price.replace(/,/g, ''));
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

const setExtensionInstalled = () => {
  window.localStorage.setItem('is-comparrot-installed', 1);
}

const validateUrl = (url) => {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
}

const getFileContent = async (path) => {
  const response = await fetch(path);
  return await response.text();
}
