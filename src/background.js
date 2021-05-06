const LogoActivePath = 'assets/img/icons/extension-active-128.png';
const LogoInactivePath = 'assets/img/icons/extension-inactive-128.png';
const CheckVendorsInterval = 60 * 1000;
const BaseUrl = 'https://us-central1-botsparked.cloudfunctions.net';

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

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, {
    action: 'toggle-show-iframe',
  });
});

chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case 'show-iframe':
      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
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
});

// Will open new tab welcome page, when extension installed
chrome.runtime.onInstalled.addListener(function () {
  const newURL = 'https://joincomparrot.com/extension/welcome/';
  chrome.tabs.create({
    url: newURL,
    active: true,
  });
  return false;
});

chrome.tabs.onActivated.addListener(async function () {
  const activeTab = await getActiveTab();
  if (activeTab) {
    setIcon(activeTab.url);
  }
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo) {
  if (changeInfo.url) {
    const activeTab = await getActiveTab();
    if (activeTab && activeTab.id === tabId) {
      setIcon(changeInfo.url);
    }
  }
});

chrome.browserAction.setPopup({ popup: '' });
chrome.browserAction.setIcon({ path: LogoInactivePath });
syncVendors();
setInterval(syncVendors, CheckVendorsInterval);
