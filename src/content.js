const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;

const iframeID = 'extension-iframe';
const activeClassName = 'active';
const inactiveClassName = 'inactive';
const inClassName = 'in';
const expandedClassName = 'expanded';
const remove = 'remove';
const add = 'add';

const getIframe = () => document.getElementById(iframeID);

const toggleShowIframe = () => {
  const iframe = getIframe();
  const isActive = iframe.classList.contains(activeClassName);

  const toggleActiveClass = isActive ? remove : add;
  const toggleInactiveClass = isActive ? add : remove;
  iframe.classList[toggleActiveClass](activeClassName);
  iframe.classList[toggleActiveClass](inClassName);
  iframe.classList[toggleInactiveClass](inactiveClassName);
};

const hideIframe = () => {
  const iframe = getIframe();

  iframe.classList.remove(activeClassName);
  iframe.classList.remove(inClassName);
  iframe.classList.add(inactiveClassName);
};

const toggleExpandIframe = isOpen => {
  const iframe = getIframe();

  const toggleExpandedClass = isOpen ? add : remove;

  iframe.classList[toggleExpandedClass](expandedClassName);
};

if (!location.ancestorOrigins.contains(extensionOrigin)) {
  const iframe = document.createElement('iframe');
  iframe.id = iframeID;
  // Must be declared at web_accessible_resources in manifest.json
  iframe.src = chrome.runtime.getURL('index.html');
  document.body.appendChild(iframe);
}

chrome.extension.onMessage.addListener(function(msg) {
  switch (msg.action) {
    case 'toggle-show-iframe':
      toggleShowIframe();
      break;

    case 'hide-iframe':
      hideIframe();
      break;

    case 'toggle-expand-iframe':
      toggleExpandIframe(msg.isOpen);
      break;

    default:
      break;
  }
});

document.body.addEventListener('click', hideIframe);

