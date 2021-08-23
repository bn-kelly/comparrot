export const SiteForceLogin = 'site-force-login';
export const SiteForceLogout = 'site-force-logout';
export const SetUserId = 'set-user-id';
export const GetUserId = 'get-user-id';
export const PerformGoogleSearch = 'perform-google-search';
export const TryToScrapeData = 'try-to-scrape-data';
export const ToggleExpandIframeWidth = 'toggle-expand-iframe-width';
export const ShowIframe = 'show-iframe';
export const HideIframe = 'hide-iframe';
export const ChangeIframeStyle = 'change-iframe-style';
export const AddClass = 'add-class';
export const RemoveClass = 'remove-class';
export const StartSpinExtensionIcon = 'start-spin-extension-icon';
export const StopSpinExtensionIcon = 'stop-spin-extension-icon';
export const ExtensionHomeLoaded = 'extension-home-loaded';
export const ExtensionLoaded = 'extension-loaded';
export const GetProductURL = 'get-product-url';

export const SiteURL = 'https://joincomparrot.com';
export const PathToSiteSettings = `${SiteURL}/settings`;
export const PathToSiteTermsOfService = `${SiteURL}/terms`;
export const PathToSitePrivacyPolicy = `${SiteURL}/privacy`;
export const BaseAmazonURL = 'https://www.amazon.com/exec/obidos/ASIN/';

export const GoogleXPaths = {
  g_prod_url:
    'https://www.google.com/shopping/product/xxxxx/offers?q=qqqqq&prds=cid:xxxxx,scoring:p',
  g_step1_href_xpath:
    "//div[contains(@class,'psmkhead')]/preceding-sibling::div//h3[@class='r']/a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))]/@href|//div[@class='psjtitle']/a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))]/@href|(//div[@class='psjtitle']/a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))]/@href)|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0 and count(div[contains(text(),'Other Matches')])=0 and count(div[contains(text(),'People also considered')])=0]//a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))][not(../span)]/@href",
  g_step1_no_results_xpath:
    "string-length(//span[contains(., 'No results for') or contains(., 'Did you mean')]|//p[contains(.,'did not match')])",
  g_step1_price_xpath:
    "//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//span[@class='price']/b|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//div[@data-sh-or='price']//div/span/span[1]",
  g_step1_retailer_xpath:
    "//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//span[@class='price']/following-sibling::text()|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//div[@data-sh-or='price']//following-sibling::div/span",
  g_step1_ship_xpath: "//span[@class='price']/following-sibling::text()",
  g_step1_title_xpath:
    "//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//h3[contains(@class,'r')]|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//a[contains(@data-what,'1')]//h3",
  g_step1_image_xpath:
    "//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//div[contains(@class,'sh-dlr__thumbnail')]//div[@data-tu]/@data-tu",
  g_step1_url_xpath:
    "//div[contains(@class,'psmkhead')]/preceding-sibling::div//h3[@class='r']/a|(//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0 and count(div[contains(text(),'Other Matches')])=0]//a[contains(@data-what,'1') and not(//div[contains(@class,'psmkhead')]) and not(//span[contains(text(), 'Did you mean:')]) and not(span[contains(text(), 'Shop for all')])])|(//div[@class='psgicont' and not(//div[contains(@class,'psmkhead')]) and not(//span[contains(text(), 'Did you mean:')]) and not(span[contains(text(), 'Shop for all')])]/a)",
  g_step2_href_xpath:
    "//tbody[@id='sh-osd__online-sellers-cont']/tr[@class='sh-osd__offer-row']/td[1]/div[1]/a",
  g_step2_price_xpath:
    "//tr[@class='sh-osd__offer-row']//td[contains(text(),'Item price')]/following-sibling::*",
  g_step2_ship_xpath:
    "//tr[@class='sh-osd__offer-row']//td[contains(text(),'Shipping') or contains(text(),'Delivery') ]/following-sibling::*",
  g_step2_tax_xpath:
    "//tr[@class='sh-osd__offer-row']//td//span[contains(text(),'Estimated Tax') or contains(text(),'Estimated Tax')]//parent::td/following-sibling::*",
  g_step2_title_xpath:
    "//h1[@id='product-name']|//a[contains(@class, 'title')]",
  g_step2_image_xpath:
  "//div[@id='sg-product__pdp-container']//img/@src",
  g_step2_total_price_xpath:
    "//tr[@class='sh-osd__offer-row']//td[contains(text(),'Total price')]/following-sibling::*",
  order_confirmation_xpath:
    "count(//*[text()[contains(.,'Your order has been placed') or contains(.,'Thank you for placing your order') or contains(.,'Order complete') or contains(.,'Thank you for ordering') or contains(.,'Thanks for ordering from') or contains(.,'Thank you for your order') or contains(.,'Order receipt') or contains(.,'Purchase complete') or contains(.,'Thanks for your purchase') or contains(.,'Thank you for your purchase') or contains(.,'Your order has been placed') or contains(.,'Your Order Has Been Placed') or contains(.,'Thank You For Placing Your Order') or contains(.,'Order Complete') or contains(.,'Thank You For Ordering') or contains(.,'Thanks For Ordering From') or contains(.,'Thank You For Your Order') or contains(.,'Order Receipt') or contains(.,'Purchase Complete') or contains(.,'Thanks For Your Purchase') or contains(.,'Thank You For Your Purchase') or contains(.,'Your Order Has Been Placed') or contains(.,'your order has been placed') or contains(.,'thank you for placing your order') or contains(.,'order complete') or contains(.,'thank you for ordering') or contains(.,'thanks for ordering from') or contains(.,'thank you for your order') or contains(.,'order receipt') or contains(.,'purchase complete') or contains(.,'thanks for your purchase') or contains(.,'thank you for your purchase') or contains(.,'your order has been placed')]])",
  a_search_url: "https://www.amazon.com/gp/aw/s/ref=is_s_?ie=UTF8&k=qqqqq",
  a_asin_xpath: "//span[@data-component-type='s-search-results']//div[@data-asin][.//a[contains(@class, 'a-link-normal a-text-normal') and not(contains(@href,'slredirect'))]][1]/@data-asin",
  a_price_xpath: "concat(//span[@data-component-type='s-search-results']//div[@data-asin][.//a[contains(@class, 'a-link-normal a-text-normal') and not(contains(@href,'slredirect'))]][1]//span[@class='a-price-whole'],//span[@data-component-type='s-search-results']//div[@data-asin][.//a[contains(@class, 'a-link-normal a-text-normal') and not(contains(@href,'slredirect'))]][1]//span[@class='a-price-fraction'])",
  a_prime_xpath: "//span[@data-component-type='s-search-results']//div[@data-asin][.//a[contains(@class, 'a-link-normal a-text-normal') and not(contains(@href,'slredirect'))]][1]//i[@aria-label='Amazon Prime']/@aria-label",
  a_ship_xpath: "//span[@data-component-type='s-search-results']//div[@data-asin][.//a[contains(@class, 'a-link-normal a-text-normal') and not(contains(@href,'slredirect'))]][1]//span[contains(text(), 'Shipping') or contains(text(), 'shipping') or contains(text(), 'FREE')]",
  a_title_xpath: "//span[@data-component-type='s-search-results']//div[@data-asin][.//a[contains(@class, 'a-link-normal a-text-normal') and not(contains(@href,'slredirect'))]][1]//span[contains(@class,'a-text-normal')]",
  a_image_xpath: "//span[@data-component-type='s-search-results']//div[@data-asin][.//a[contains(@class, 'a-link-normal s-no-outline') and not(contains(@href,'slredirect'))]][1]//img[contains(@class,'s-image')]/@src",
};
