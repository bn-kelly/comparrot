const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;

const iframeID = 'extension-iframe';
const activeClassName = 'active';
const inactiveClassName = 'inactive';

if (!location.ancestorOrigins.contains(extensionOrigin)) {
  const iframe = document.createElement('iframe');
  iframe.id = iframeID;
  // Must be declared at web_accessible_resources in manifest.json
  iframe.src = chrome.runtime.getURL('index.html');
  document.body.appendChild(iframe);
}

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action === 'toggle-iframe') {
    const iframe = document.getElementById(iframeID);

    const toggleActiveClass = iframe.classList.contains(activeClassName) ? 'remove' : 'add';
    iframe.classList[toggleActiveClass](activeClassName);
    if (iframe.classList.contains(activeClassName)) {
      iframe.classList.remove(inactiveClassName);
    } else {
      iframe.classList.add(inactiveClassName);
    }
  }
});

document.body.addEventListener('click', function(e) {
  const iframe = document.getElementById(iframeID);

  if (iframe.classList.contains(activeClassName)) {
    iframe.classList.remove(activeClassName);
    iframe.classList.add(inactiveClassName);
  }

});

