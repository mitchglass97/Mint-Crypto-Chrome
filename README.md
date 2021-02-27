![Mint Crypto logo](https://i.imgur.com/cIajbfa.png)
# Mint Crypto Chrome Extension 

![Mint Crypto screenshot](https://i.imgur.com/LOdJl2c.png)

Mint Crypto is a Chrome extension designed to **easily keep track of the value of your cryptocurrency in your Mint account**. All you have to do is enter the symbol and quantity of your coin(s), click Sync, and Mint Crypto will create (or edit) a custom property called "Cryptocurrency" with the current value of your crypto.

Mint Crypto makes it easy to keep your account updated with the value of cryptocurrency that you own in wallets/exchanges that can't be added to Mint natively, such as Kraken, Binance, Natrium NANO wallet, and hardware wallets.

Your latest coin submission is always stored in the extension via [chrome.storage](https://developer.chrome.com/docs/extensions/reference/storage/). You can easily open Mint Crypto and just hit Sync any time you are logged into Mint, or add/delete/modify coins if your holdings have changed.

Mint Crypto uses the [Binance API](https://github.com/binance/binance-spot-api-docs)  to get crypto price data.

This extension was built off of [lxieyang's Chrome extension boilerplate, which uses React 17 and Webpack 5](https://github.com/lxieyang/chrome-extension-boilerplate-react)

## Download

*Currently awaiting Chrome Web Store approval*

## Code

There are two separate pieces to this extension-- the popup script and the content script. *(Note: Chrome extensions, can also include a background script but this extension does not use a background script.)*

### Popup

The **popup** script defines the popup window that you see when you click the extension icon in the toolbar. 

The popup script itself **cannot interact with a website**. That is the content script's job. The popup **gathers information** from the user, then sends it off to the content script to interact with the Mint website.

The popup window displays a form where a user can input the symbol and amount of a cryptocurrency. A user can dynamically add or delete any desired number of cryptocurrencies to the form. The minimum amount is 1.

The form **can only be submitted if all the inputs are valid**:

 - An input in the "**Name**" field is valid if it matches a symbol in Binance's list of supported coins, which is fetched from the Binance API when the popup is opened and stored in an array. Coins must be entered as their *symbol*, e.g. BTC not Bitcoin.
 - An input in the "**Quantity**" field is valid if it is a valid number and greater than 0.
 
Once the form is submitted, a **message is sent to the content script** with an array of all the coin objects. An object might look like {name: BTC, quantity: 0.5}. The popup script also save's the user's coin data to chrome.storage so that the latest coin is always there when the extension is opened.

### Content Script 

The **content** script is able to interact directly with web pages. 

After the content script receives a message from the popup with information about the user's cryptocurrency, it **fetches the prices of the coin(s) from the Binance API** and calculates the total value of the user's crypto. 

The content script will then interact with the website and create or edit a property named "Cryptocurrency". If the property already exists (e.g. if the user has already used the extension at least once), then Mint Crypto just updates the existing property.