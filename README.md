![Mint Crypto logo](https://user-images.githubusercontent.com/52224377/111899772-84572680-89fc-11eb-9bac-35fbccf564a9.png)

# Mint Crypto Chrome Extension

Mint Crypto is a Chrome extension designed to easily **keep the value of your cryptocurrency updated in your [Mint](https://mint.intuit.com/) account**. All you have to do is enter the symbol and quantity of your crypto(s), click Sync, and Mint Crypto will create or edit a custom asset/property in Mint called "Cryptocurrency" with the current value of your crypto.

Mint Crypto has a popup window (seen below) that can be opened by clicking the extension icon in the toolbar. You must use this pop-up window for first-time setup. **After first-time setup, Mint Crypto will automatically update your account with the current value of your crypto in a new tab every time you log into Mint** as long as it has more than than 30 minutes since your last sync.

![Mint Crypto screenshot](https://i.imgur.com/LOdJl2c.png)

You can still use the pop-up window after first-time setup if you want to 1) modify your holdings or 2) force a sync.

Mint Crypto makes it easy to add crypto to Mint that you own in places that can't be added to Mint natively, such as exchanges like Kraken and Binance, as well as wallets like Natrium (NANO wallet).

Mint Crypto uses the [Binance API](https://github.com/binance/binance-spot-api-docs) to get crypto price data, meaning that Mint Crypto supports any coins that Binance supports.

This extension was built off of [lxieyang's Chrome Extension Boilerplate with React 17 and Webpack 5](https://github.com/lxieyang/chrome-extension-boilerplate-react)

## Important

1. If you change the name of the property from "Cryptocurrency", the extension will not work
2. Coins must be entered as their _symbol_, e.g. must be "BTC" not "Bitcoin"
3. Currently if you need to modify your crypto holdings, you first need to let the extension run an automatic sync, then you can interact with the extension pop-up (via toolbar icon) after the automatic sync has completed. In a future update, I will add an option (a button on the "Syncing" notification) to abort the automatic update.

## Download

Currently available in the [Chrome Web Store](https://chrome.google.com/webstore/detail/mint-cryptocurrency/dnbcgdhnmmicanggippnllpfjlidncba?hl=en&authuser=1)
[![chrome web store icon](https://user-images.githubusercontent.com/52224377/111899682-21658f80-89fc-11eb-9a54-bbbeb1412439.PNG)
](https://chrome.google.com/webstore/detail/mint-cryptocurrency/dnbcgdhnmmicanggippnllpfjlidncba?hl=en&authuser=1)

## Code

The extension is split into three parts: popup script, content script, and background script.

### Popup

The [**popup**](./src/pages/Popup/Popup.jsx) script defines the **popup window that you see when you click the extension icon** in the toolbar.

The popup script itself **cannot interact with a website**. That is the content script's job. The popup **gathers information from the user**, then sends it off to the content script to interact with the Mint website.

The popup window displays a form where a user can input the symbol and amount of a cryptocurrency. A user can dynamically add or delete any desired number of cryptocurrencies to the form. The minimum amount is 1.

The form **can only be submitted if all the inputs are valid**:

- An input in the "**Name**" field is valid if it matches a symbol in Binance's list of supported coins, which is fetched from the Binance API when the popup is opened and stored in an array.
- An input in the "**Quantity**" field is valid if it is a valid number and greater than 0.

Once the form is submitted, a **message is sent to the content script** (using [chrome.tabs.sendMessage](https://developer.chrome.com/docs/extensions/reference/tabs/#method-sendMessage)) with an array of all the coin objects. An object might look like {name: BTC, quantity: 0.5}. The popup script also save's the user's coin data to chrome.storage so that the latest crypto is always there when the extension is opened.

### Content

The [**content**](./src/pages/Content/index.js) script takes informationfrom the popup or background scripts and **directly interacts with the Mint.com web page.**

Content script will receive a message from background or popup scripts saying, hey, update the user's Mint account! The content script then fetches the prices of the coin(s) from the Binance API and calculates the total value of the user's crypto. The content script will then **interact with Mint.com and click through the process of either editing or creating a property/asset named "Cryptocurrency"**. If the property already exists (e.g. if the user has already used the Mint Crypto extension at least once), then Mint Crypto just updates the existing property.

Two other things the Content script will do is **display either a "syncing" or "sync complete" message in the top right of the page**.

### Background

The background script is always running in the browser and has the highest-level access out of all the parts of a Chrome extension. The background script can do things like create a new tab in Chrome. The background script relays info between the popup and content scripts. Please see the diagram below for an overview of the extension logic.

![Background Logic](https://user-images.githubusercontent.com/52224377/111896678-51effe00-89e9-11eb-9ecd-98160c2271c6.png)

## Privacy

The extension runs locally on your machine only. Mint Crypto does not collect or share any information.

## Update History

1.0.1 - Mint Crypto now syncs automatically in a new tab when user logs into Mint

## Logo/Design

I created the Mint Crypto logo using Inkscape, and the promo images (example below) using Figma

![big - chrome store](https://user-images.githubusercontent.com/52224377/111917849-1a686c80-8a50-11eb-849e-c5607f39f175.png)
