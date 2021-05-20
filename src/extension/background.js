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
  chrome.runtime.onMessage.addListener(handleMessage);
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

const searchGoogle = async (product) => {
  if (!product) {
    return;
  }

  console.log('product', product);
  const search = product.upc || product.title;
  const url = `https://www.google.com/search?tbm=shop&tbs=vw:1,new:1,price:1,ppr_max:${product.price}&q=${search}`;
  const doc = await getDocFromUrl(url);
  let data = [];

  const noResults = getXPathString(doc, GoogleXPaths.g_step1_no_results_xpath);
  console.log('noResults', noResults);
  if (parseInt(noResults)) {
    return;
  }

  const href = getXPathString(doc, GoogleXPaths.g_step1_href_xpath);
  console.log('href', href);
  if (href.length === 0) {
    const urls = getXPathArray(doc, GoogleXPaths.g_step1_url_xpath);
    const arrUrls = [];
    let node = urls.iterateNext();

    if (!node) {
      return;
    }

    while (node) {
      const url = extractGUrl(node.getAttribute('href'));
      arrUrls.push(url);
      node = urls.iterateNext();
    }

    const prices = getXPathArray(doc, GoogleXPaths.g_step1_price_xpath);
    const arrPrices = [];
    node = prices.iterateNext();
    while (node) {
      arrPrices.push(node.textContent);
      node = prices.iterateNext();
    }
    
    const retailers = getXPathArray(doc, GoogleXPaths.g_step1_retailer_xpath);
    const arrRetailers = [];
    node = retailers.iterateNext();

    while(node) {
      arrRetailers.push(node.textContent);
      node = retailers.iterateNext();
    }

    const titles = getXPathArray(doc, GoogleXPaths.g_step1_title_xpath);
    const arrTitles = [];
    node = titles.iterateNext();

    while (node) {
      arrTitles.push(node.textContent);
      node = titles.iterateNext();
    }

    for (let i=0; i<arrRetailers.length; i++) {
      data.push({
        name: clean(arrRetailers[i]),
        url: `https://www.google.com${arrUrls[i]}`,
        price: clean(arrPrices[i]),
        title: arrTitles[i],
      });
    }
  } else {
    const id = href.split('product/')[1].split('?')[0];
    data = await getGooglePrices(id, search);
  }

  for (let i=0; i<data.length; i++) {
    const doc = await getDocFromUrl(data[i].url);
    const retailers = await getStorageValue('retailers');
    const retailer = retailers.find(r => {
      return data[i].name === r.name;
    });

    if (!retailer) {
      continue
    }

    const image = doc.querySelector(retailer.selectors?.product?.image[0]);
    data[i].image = image ? image.getAttribute('src') : null;
  }

  console.log('searchGoogle:data', data);
}

const getGooglePrices = async (id, search) => {
  let url = GoogleXPaths.g_prod_url;
  url = url.replace(/xxxxx/g, id);
  url = url.replace(/qqqqq/g, search);
  const doc = await getDocFromUrl(url);

  const arrRetailers = [];
  const arrUrls = [];
  const arrPrices = [];

  const links = getXPathArray(doc, GoogleXPaths.g_step2_href_xpath);
  let node = links.iterateNext();

  while (node) {
    arrUrls.push(node.getAttribute('href'));
    arrRetailers.push(node.childNodes[0].textContent);
    node = links.iterateNext();
  }

  const prices = getXPathArray(doc, GoogleXPaths.g_step2_price_xpath);
  node = prices.iterateNext();

  while (node) {
    arrPrices.push(node.textContent);
    node = prices.iterateNext();
  }

  const title = getXPathString(doc, GoogleXPaths.g_step2_title_xpath);

  const data = [];
  for (let i=0; i<arrRetailers.length; i++) {
    data.push({
      name: clean(arrRetailers[i]),
      url: `https://www.google.com${extractGUrl(arrUrls[i])}`,
      price: clean(arrPrices[i]),
      title,
    });
  }

  return data;
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
