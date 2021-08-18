let spinIcon = false;
let affiliateTabs = {};

const init = () => {
  chrome.browserAction.setPopup({ popup: '' });
  chrome.browserAction.setIcon({ path: LogoInactivePath });
  syncRetailers();
  setInterval(syncRetailers, CheckRetailersInterval);
  initEvents();
};

const initEvents = () => {
  chrome.browserAction.onClicked.addListener(onBrowserActionClicked);
  chrome.commands.onCommand.addListener(onCommand);
  chrome.runtime.onInstalled.addListener(onInstalled);
  chrome.tabs.onActivated.addListener(onTabsActivated);
  chrome.tabs.onUpdated.addListener(onTabsUpdated);
  chrome.runtime.onMessage.addListener(onMessageReceived);
};

/**
 * Set icon against a url
 * @param {string} url
 */
const setIcon = async url => {
  const retailers = await getStorageValue('retailers');

  if (!Array.isArray(retailers)) {
    return;
  }

  const regexes = [/\\*\.?joincomparrot\.com\\*/];

  for (const retailer of retailers) {
    if (!retailer.url || retailer.url === '') {
      continue;
    }

    const regex = new RegExp(`\\\\*\\\.${retailer.url}\\\\*`);
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
};

/**
 * Sync retailers between extension and database
 */
const syncRetailers = () => {
  fetch(`${BaseUrl}/retailers`)
    .then(response => response.json())
    .then(async data => {
      setStorageValue({ retailers: data.retailers });

      const activeTab = await getActiveTab();
      if (activeTab) {
        setIcon(activeTab.url);
      }
    });
};

const logError = (message) => {
  message = 'Type: Extension <br>' + message;

  fetch(`${BaseUrl}/logError`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })
  .then(response => response.json())
  .then(async data => {
    console.log('logError', data);
  });
};

const onBrowserActionClicked = tab => {
  chrome.tabs.sendMessage(tab.id, {
    action: ToggleShowIframe,
  });
};

const onCommand = command => {
  switch (command) {
    case ShowIframe:
      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        const id = tabs && tabs[0] && tabs[0].id;
        if (id) {
          chrome.tabs.sendMessage(id, {
            action: ShowIframe,
          });
        }
      });
      break;

    default:
      break;
  }
};

const onInstalled = (details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: WelcomeUrl,
      active: true,
    });
  }
  return false;
};

const onTabsActivated = async () => {
  const activeTab = await getActiveTab();
  if (activeTab) {
    setIcon(activeTab.url);
  }
};

const onTabsUpdated = async (tabId, changeInfo, tab) => {
  const activeTab = await getActiveTab();
  const activeTabId = activeTab ? activeTab.id : null;

  if (activeTab && activeTabId === tabId) {
    setIcon(activeTab.url);
  }

  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, {
      action: TabUpdated,
    });
  }
};

const onMessageReceived = async (message, sender, sendResponse) => {
  if (message.action === StartSpinExtensionIcon && !spinIcon) {
    let index = 0;
    spinIcon = true;
    while(spinIcon) {
      chrome.browserAction.setIcon({ path: `assets/img/icons/extension-spin-${(index++ % 12)}.png` });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } else if (message.action === StopSpinExtensionIcon && spinIcon) {
    spinIcon = false;
    chrome.browserAction.setIcon({ path: 'assets/img/icons/extension-active-128.png' });
  } else if (message.action === LogError && message.data) {
    logError(message.data);
  } else if (message.action === OpenDemoProduct && message.data) {
    chrome.tabs.create({
      url: message.data,
      active: false,
    });
  }
}

init();
