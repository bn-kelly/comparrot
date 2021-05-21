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
};

/**
 * Set icon against a url
 * @param {string} url
 */
const setIcon = async (url) => {
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
      console.log(data.retailers);
      setStorageValue({ retailers: data.retailers });

      const activeTab = await getActiveTab();
      if (activeTab) {
        setIcon(activeTab.url);
      }
    });
};

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

init();
