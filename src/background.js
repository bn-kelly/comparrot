chrome.browserAction.setPopup({
  popup: '',
});

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

// Will change the logo disable/enable on supported sites
const checkIsInWhitelisted = (whiteListedUrls, cb, currentUrl = null) => {
  const matcher = (regex, str) => regex.test(str);
  const examineCurrentUrl = strCurrentUrl => {
    if (strCurrentUrl) {
      let currentUrl = new URL(strCurrentUrl);
      let currentHostName = currentUrl.hostname;
      if (Array.isArray(whiteListedUrls)) {
        const found = whiteListedUrls.filter(regEx => {
          return matcher(regEx, currentHostName);
        });
        cb(found.length > 0);
        return found.length > 0;
      } else {
        const found = matcher(whiteListedUrls, currentHostName);
        cb(!!found);
        return !!found;
      }
    } else {
      cb(false);
      return false;
    }
  };
  if (currentUrl === null) {
    if (typeof chrome.tabs !== 'undefined') {
      chrome.tabs.onActivated.addListener(function () {
        chrome.tabs.query(
          {
            active: true,
            currentWindow: true,
          },
          function (tabs) {
            examineCurrentUrl(tabs[0].url);
          },
        );
      });
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
        if (changeInfo.status === 'loading' && changeInfo.url) {
          chrome.tabs.query(
            {
              active: true,
              currentWindow: true,
            },
            function (currentTabs) {
              if (currentTabs[0].id === tabId) {
                examineCurrentUrl(changeInfo.url);
              }
            },
          );
        }
      });
    } else {
      examineCurrentUrl(window.location.href);
    }
  } else {
    return examineCurrentUrl(currentUrl);
  }
};

const icon = () => {
  const supportedSites = [
    /\\*\.6pm\.\\*!/,
    /\\*\.abercrombie\.\\*!/,
    /\\*\.acehardware\.\\*!/,
    /\\*\.adidas\.\\*!/,
    /\\*\.albertsons\.\\*!/,
    /\\*\.allmodern\.\\*!/,
    /\\*\.amazon\.\\*/,
    /\\*\.apple\.\\*!/,
    /\\*\.autozone\.\\*!/,
    /\\*\.bedbathandbeyond\.\\*!/,
    /\\*\.bestbuy\.\\*!/,
    /\\*\.biglots\.\\*!/,
    /\\*\.bloomingdales\.\\*!/,
    /\\*\.costco\.\\*!/,
    /\\*\.dickssportinggoods\.\\*!/,
    /\\*\.ebay\.\\*!/,
    /\\*\.finishline\.\\*!/,
    /\\*\.footlocker\.\\*!/,
    /\\*\.gamestop\.\\*!/,
    /\\*\.gap\.\\*!/,
    /\\*\.goat\.\\*!/,
    /\\*\.hm\.\\*!/,
    /\\*\.hobbylobby\.\\*!/,
    /\\*\.homedepot\.\\*!/,
    /\\*\.jcpenney\.\\*!/,
    /\\*\.?joincomparrot\.com\\*/,
    /\\*\.kohls\.\\*!/,
    /\\*\.lowes\.\\*!/,
    /\\*\.macys\.\\*!/,
    /\\*\.menards\.\\*!/,
    /\\*\.nike\.\\*!/,
    /\\*\.nordstrom\.\\*!/,
    /\\*\.nordstromrack\.\\*!/,
    /\\*\.officedepot\.\\*!/,
    /\\*\.petsmart\.\\*!/,
    /\\*\.sears\.\\*!/,
    /\\*\.sephora\.\\*!/,
    /\\*\.shopify\.\\*!/,
    /\\*\.shopify-v2\.\\*!/,
    /\\*\.shopify-v3\.\\*!/,
    /\\*\.staples\.\\*!/,
    /\\*\.stockx\.\\*!/,
    /\\*\.target\.\\*!/,
    /\\*\.tjmaxx\.\\*!/,
    /\\*\.ulta\.\\*!/,
    /\\*\.walmart\.\\*!/,
    /\\*\.wayfair\.\\*!/,
    /\\*\.zappos\.\\*!/,
  ];
  const logoActivePath = 'assets/img/icons/extension-active-128.png';
  const logoInactivePath = 'assets/img/icons/extension-inactive-128.png';
  chrome.browserAction.setIcon({ path: logoInactivePath });

  checkIsInWhitelisted(supportedSites, isSupported => {
    if (isSupported) {
      chrome.browserAction.setIcon({ path: logoActivePath });
    } else {
      chrome.browserAction.setIcon({ path: logoInactivePath });
    }
  });
};
icon();
