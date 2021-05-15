![Mint Crypto logo](https://user-images.githubusercontent.com/52224377/111899772-84572680-89fc-11eb-9bac-35fbccf564a9.png)

# Mint Crypto Chrome Extension

Mint Crypto is a Chrome extension designed to easily **keep the value of your cryptocurrency updated in your [Mint](https://mint.intuit.com/) account**. Mint Crypto makes it easy to add crypto to Mint that you own in places that can't be added to Mint natively, such as crypto wallets and many crypto exchanges.

## About

To use Mint Crypto, all you have to do is enter the symbol and quantity of your crypto(s) while logged into Mint, click Sync, and Mint Crypto will create or edit a custom asset/property in Mint called "Cryptocurrency" with the current value of your crypto. **After first-time setup, Mint Crypto will automatically update your account with the current value of your crypto in a new tab every time you log into Mint** as long as it has more than than 30 minutes since your last sync.

![Mint Crypto screenshot](https://user-images.githubusercontent.com/52224377/118342431-f756b800-b4e8-11eb-8bdb-fac517d65d62.PNG)

You can still use the pop-up window after first-time setup if you want to 1) modify your holdings or 2) force a sync.

Mint Crypto uses the [Binance API](https://github.com/binance/binance-spot-api-docs) to get crypto price data, meaning that Mint Crypto supports any coins that Binance supports (350+).

As of version 1.0.3, Mint Crypto uses [The Free Currency Converter API](https://free.currencyconverterapi.com/) to convert from USD to other currencies such as CAD or EUR if a user selects a non-USD currency.

This extension is built off of [lxieyang's Chrome Extension Boilerplate with React 17 and Webpack 5](https://github.com/lxieyang/chrome-extension-boilerplate-react)

### Important Usage Notes

1. If you change the name of the custom property in Mint.com from "Cryptocurrency", the extension will not work
2. Coins must be entered as their _symbol_, e.g. must be "BTC" not "Bitcoin"
3. Currently, if you want to change your crypto holdings, you first need to let the extension run an automatic sync, then you can interact with the extension pop-up (via toolbar icon) after the automatic sync has completed. In a future update, I will add an way to circumvent this by manually aborting the automatic update.

## Download/Install

Currently available in the [Chrome Web Store](https://chrome.google.com/webstore/detail/mint-cryptocurrency/dnbcgdhnmmicanggippnllpfjlidncba?hl=en&authuser=1)

[![chrome web store icon](https://user-images.githubusercontent.com/52224377/111899682-21658f80-89fc-11eb-9a54-bbbeb1412439.PNG)
](https://chrome.google.com/webstore/detail/mint-cryptocurrency/dnbcgdhnmmicanggippnllpfjlidncba?hl=en&authuser=1)

## Code

This extension, like any Chrome Extension, is split into three parts: a popup script, a content script, and a background script.

### Popup Script

The [**popup**](./src/pages/Popup/Popup.jsx) script defines the visual part of the extension-- the popup window that you see when you click the extension icon in the toolbar.

The popup script itself cannot interact with a website, it can only gather information from the user and send messages to the content and background scripts. When the user submits the pop-up form by clicking Sync, the popup script does two things:

Once the form is submitted, a **message is sent to the content script** (using [chrome.tabs.sendMessage](https://developer.chrome.com/docs/extensions/reference/tabs/#method-sendMessage)) with an array of all the coin objects and the user's preferred currency. An object might look like {name: "BTC", quantity: 0.5}. The popup script also save's the user's coin data **locally** to chrome.storage so that Mint Crypto can run automatic syncs whenever the user logs in.

Note: The popup form can only be submitted if all the inputs are valid:

- An input in the "**Name**" field is valid if it matches a symbol in Binance's list of supported coins, which is fetched from the Binance API when the popup is opened and stored in an array.
- An input in the "**Quantity**" field is valid if it is a valid number (!isNaN) and greater than 0.

### Content Script

The [**content**](./src/pages/Content/index.js) script runs on any Chrome tab that is on Mint.com. It is the only script that can directly interact with a web page and do things like fill out forms and click buttons.

The content script will receive a message from background or popup scripts saying "Hey, please update the user's Mint account." The content script then takes the user's coin info and calculates the value of the coin(s) using the Binance API. The content script will then interact with Mint.com and click through the process of either or editing a property/asset named "Cryptocurrency" with the calculated value. (If the user selects a currency that is not USD, the content script will also make a call to The Free Currency Converter API to convert the USD value to another currency.

The content script also displays either a "syncing" or "sync complete" message in the top right of the page.

### Background Script

The background script also has the highest-level access out of all the parts of a Chrome extension. The background script is always running, whereas the popup script can only run when the popup is open and the content script can only run on tabs that are on Mint.com (as specified in the host permissions in the manifest.json file).

Below is a flowchart describing the logic flow of how/when Mint Crypto performs an automatic sync.

![Background Logic](https://user-images.githubusercontent.com/52224377/111896678-51effe00-89e9-11eb-9ecd-98160c2271c6.png)

## Privacy

The extension runs **locally** on your machine only. Mint Crypto **does not collect or share any information.**

## Update History

1.0.1 - Mint Crypto now syncs automatically in a new tab when user logs into Mint

1.0.2 - Removed tabs permission. This was used to determine when user was logged into mint but resulted in a message to the user when installing that said the extension could "Read your browsing history." Reworked the extension to determine when logged into mint without using chrome.tabs.URL

1.0.3 - Added support for the following currencies: CAD, AUD, EUR, CNY, JPY, INR, GBP, MXN, and CHF

## Logo/Design

I created the Mint Crypto logo using Inkscape, and the promo images (example below) using Figma

![big - chrome store](https://user-images.githubusercontent.com/52224377/118342744-57019300-b4ea-11eb-891e-810f82e7d155.png)
