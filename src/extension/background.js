const init = () => {
  chrome.browserAction.setPopup({ popup: '' });
  chrome.browserAction.setIcon({ path: LogoInactivePath });
  syncVendors();
  setInterval(syncVendors, CheckVendorsInterval);
  initEvents();
};

const initEvents = () => {
  chrome.browserAction.onClicked.addListener(onBrowserActionClicked);
  chrome.commands.onCommand.addListener(onCommand);
  chrome.runtime.onInstalled.addListener(onInstalled);
  chrome.tabs.onActivated.addListener(onTabsActivated);
  chrome.tabs.onUpdated.addListener(onTabsUpdated);
  chrome.runtime.onMessage.addListener(handleMessage);
};

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

/**
 * Set icon against a url
 * @param {string} url
 */
const setIcon = url => {
  chrome.storage.local.get(['vendors'], result => {
    const vendors = result['vendors'];
    if (!Array.isArray(vendors)) {
      return;
    }

    const regexes = [/\\*\.?joincomparrot\.com\\*/];

    for (const vendor of vendors) {
      if (!vendor) {
        continue;
      }

      const name = vendor.split('.')[0];
      if (name === '') {
        continue;
      }

      const regex = new RegExp(`\\\\*\\\.${name}\\\.\\\\*`);
      regexes.push(regex);
    }

    const isSupported =
      regexes.filter(regex => {
        return regex.test(url);
      }).length > 0;

    if (isSupported) {
      chrome.browserAction.setIcon({ path: LogoActivePath });
    } else {
      chrome.browserAction.setIcon({ path: LogoInactivePath });
    }
  });
};

/**
 * Sync vendors between extension and database
 */
const syncVendors = () => {
  fetch(`${BaseUrl}/getVendors`)
    .then(response => response.json())
    .then(async data => {
      chrome.storage.local.set({
        vendors: data.vendors,
      });

      const activeTab = await getActiveTab();
      if (activeTab) {
        setIcon(activeTab.url);
      }
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

/**
 * Trip spaces and remove html entities
 * @param {string} str 
 */
const clean = (str) => {
  return str ? str.replace(/&nbsp;/g, '').replace(/&amp;/g, '').replace(/^\s+|\s+$/g, "") : '';
}

const searchGoogle = async (product) => {
  if (!product) {
    return;
  }

  console.log('product', product);
  const url = `https://www.google.com/search?tbm=shop&tbs=vw:1,new:1,price:1,ppr_max:${product.price}&q=${product.title}`;
  const response = await fetch(url);
  const responseText = await response.text();
  const doc = document.implementation.createHTMLDocument('');
  doc.documentElement.innerHTML = DOMPurify.sanitize(responseText);

  const noResults = getXPathString(doc, GoogleXPaths.g_step1_no_results_xpath);
  console.log('noResults', noResults);
  if (parseInt(noResults)) {
    return;
  }

  const href = getXPathString(doc, GoogleXPaths.g_step1_href_xpath);
  console.log('href', href);
  if (href.length === 0) {
    
  }
}

const onBrowserActionClicked = (tab) => {
  chrome.tabs.sendMessage(tab.id, {
    action: 'toggle-show-iframe',
  });
}

const onCommand = (command) => {
  switch (command) {
    case 'show-iframe':
      chrome.tabs.query({ currentWindow: true, active: true }, function (
        tabs,
      ) {
        const id = tabs && tabs[0] && tabs[0].id;
        if (id) {
          chrome.tabs.sendMessage(id, {
            action: command,
          });
        }
      });
      break;

    default:
      break;
  }
}

const onInstalled = () => {
  chrome.tabs.create({
    url: WelcomeUrl,
    active: true,
  });
  return false;
}

const onTabsActivated = async () => {
  const activeTab = await getActiveTab();
  if (activeTab) {
    setIcon(activeTab.url);
  }
}

const onTabsUpdated = async (tabId, changeInfo) => {
  if (changeInfo.url) {
    const activeTab = await getActiveTab();
    if (activeTab && activeTab.id === tabId) {
      setIcon(changeInfo.url);
    }
  }
}

const handleMessage = (request, sender, sendResponse) => {
  if (request.action === PerformGoogleSearch) {
    searchGoogle(request.data);
  }
}

init();
