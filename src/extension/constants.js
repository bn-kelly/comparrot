const LogoActivePath = 'assets/img/icons/extension-active-128.png';
const LogoInactivePath = 'assets/img/icons/extension-inactive-128.png';
const CheckVendorsInterval = 60 * 1000;
const BaseUrl = 'https://us-central1-botsparked.cloudfunctions.net';
const WelcomeUrl = 'https://joincomparrot.com/extension/welcome/';

const SiteForceLogin = 'site-force-login';
const SiteForceLogout = 'site-force-logout';
const SetUserId = 'set-user-id';
const PerformGoogleSearch = 'perform-google-search';

const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;
const iframeID = 'extension-iframe';
const activeClassName = 'active';
const inactiveClassName = 'inactive';
const inClassName = 'in';
const expandedClassName = 'expanded';
const remove = 'remove';
const add = 'add';

//registry types
const baby = 'baby';