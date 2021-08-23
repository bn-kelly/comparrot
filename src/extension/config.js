const LogoActivePath = 'assets/img/icons/extension-active-128.png';
const LogoInactivePath = 'assets/img/icons/extension-inactive-128.png';
const CheckRetailersInterval = 24 * 60 * 60 * 1000;
const BaseUrl = 'https://us-central1-comparrot-8cd1d.cloudfunctions.net';
const WelcomeUrl = 'https://joincomparrot.com/welcome';

const SiteForceLogin = 'site-force-login';
const SiteForceLogout = 'site-force-logout';
const SetUserId = 'set-user-id';
const GetUserId = 'get-user-id';
const OpenDemoProduct = 'open-demo-product';
const PerformGoogleSearch = 'perform-google-search';
const TryToScrapeData = 'try-to-scrape-data';
const ToggleExpandIframeWidth = 'toggle-expand-iframe-width';
const ShowIframe = 'show-iframe';
const HideIframe = 'hide-iframe';
const ChangeIframeStyle = 'change-iframe-style';
const AddClass = 'add-class';
const RemoveClass = 'remove-class';
const ToggleShowIframe = 'toggle-show-iframe';
const StartSpinExtensionIcon = 'start-spin-extension-icon';
const StopSpinExtensionIcon = 'stop-spin-extension-icon';
const ExtensionHomeLoaded = 'extension-home-loaded';
const TabUpdated = 'tab-updated';
const ExtensionLoaded = 'extension-loaded';
const GetProductURL = 'get-product-url';
const LogError = 'log-error';

const RegUPC = /^[0-9]{12}$|^[0-9]{13}$|^[0-9]{14}$/;

const extensionOrigin = `chrome-extension://${chrome.runtime.id}`;
const containerId = 'comparrot-container';
const iframeID = 'extension-iframe';
const activeClassName = 'active';
const inactiveClassName = 'inactive';
const inClassName = 'in';
const expandedClassName = 'expanded';
const remove = 'remove';
const add = 'add';

//registry types
const baby = 'baby';
