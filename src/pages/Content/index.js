// This is the content script. The content script receives a
// message from the Popup with an array of coin objects.
//
// The content script only has access to https://mint.intuit.com/,
// so if Popup sends a message from any other URL content script
// will not receive it.
//
// For each coin object in the message array, the content script makes a
// fetch request to the Binance API for the current price of
// that coin. That data is used to calculate the total value of
// all the cryptocurrencies that the user has inputted.
//
// The content script then interacts with Mint.com to create
// a property named "Cryptocurrency" with the calculated value.
// If a property named "Cryptocurrency" already exists, then
// the content script will modify the value of that existing
// property.

let intervalTimer = null;
let userCurrencySymbol = "USD";
import secrets from "secrets"; // similar to dotenv, used for API key

setTimeout(function () {
	if (isUserLoggedIntoMint()) {
		chrome.runtime.sendMessage({ message: "loggedIntoMint" });
	}
}, 3000);

// Listener to receive a message from popup script
chrome.runtime.onMessage.addListener(
	// message received
	function (message, sender, sendResponse) {
		// message is from popup
		if (message.fromBackground == undefined) {
			setTimeout(function () {
				if (isUserLoggedIntoMint()) {
					sendResponse({ loggedIn: true });
					updateMintAccount(message.coinData, false);
				} else {
					sendResponse({ loggedIn: false });
				}
			}, 100);
			return true;
		}
		// message is from background
		else {
			// display the "syncing" message
			if (message.fromBackground == "displaySyncingOnActive") {
				displaySyncing();
				sendResponse({ displayingSync: true });
			}
			// update mint account
			else if (message.fromBackground == "runUpdateScript") {
				updateMintAccount(message.coinMessage, true, () => {
					sendResponse({ updateComplete: true });
				});
			}

			// display the "syncing" message
			else if (message.fromBackground == "syncComplete") {
				removeOverlay();
				setTimeout(function () {
					displaySyncComplete();
					setTimeout(function () {
						removeOverlay();
					}, 4000);
				}, 200);
			}
		}
	}
);

function displaySyncing() {
	// Solid color, opaque overlay. Fills the entire page
	var overlayDiv = document.createElement("overlayDiv");
	overlayDiv.setAttribute("id", "overlayDiv");
	overlayDiv.style.width = "300px";
	overlayDiv.style.height = "100px";
	overlayDiv.style.position = "fixed";
	overlayDiv.style.top = "0";
	overlayDiv.style.right = "0";
	overlayDiv.style.marginRight = "50px";
	overlayDiv.style.marginTop = "75px";
	overlayDiv.style.backgroundColor = "#333333";
	overlayDiv.style.color = "white";
	overlayDiv.style.zIndex = "999999";
	overlayDiv.classList.add("element-animation");
	document.body.appendChild(overlayDiv);

	// Text that displays in the center of the page
	var overlayText = document.createElement("overlayText");
	overlayText.setAttribute("id", "overlayText");
	overlayText.style.position = "fixed";
	overlayText.style.top = "0";
	overlayText.style.right = "0";
	overlayText.style.paddingTop = "115px";
	overlayText.style.paddingRight = "63px";
	overlayText.style.textAlign = "left";
	overlayText.style.color = "#E4E4E4";
	overlayText.style.zIndex = "9999999";
	overlayText.style.fontSize = "16px";
	overlayText.innerHTML = "Mint Crypto is syncing your crypto ºº•";
	overlayText.classList.add("element-animation");
	document.body.appendChild(overlayText);

	intervalTimer = setInterval(function () {
		animateOverlayEllipses("Mint Crypto is syncing your crypto");
	}, 500);
}

function displaySyncComplete() {
	// Solid color, opaque overlay. Fills the entire page
	var overlayDiv = document.createElement("overlayDiv");
	overlayDiv.setAttribute("id", "overlayDiv");
	overlayDiv.style.width = "300px";
	overlayDiv.style.height = "100px";
	overlayDiv.style.position = "fixed";
	overlayDiv.style.top = "0";
	overlayDiv.style.right = "0";
	overlayDiv.style.marginRight = "50px";
	overlayDiv.style.marginTop = "75px";
	overlayDiv.style.backgroundColor = "#333333";
	overlayDiv.style.color = "white";
	overlayDiv.style.zIndex = "999999";
	overlayDiv.classList.add("element-animation");
	document.body.appendChild(overlayDiv);

	// Text that displays in the center of the page
	var overlayText = document.createElement("overlayText");
	overlayText.setAttribute("id", "overlayText");
	overlayText.style.position = "fixed";
	overlayText.style.top = "0";
	overlayText.style.right = "0";
	overlayText.style.paddingTop = "115px";
	overlayText.style.paddingRight = "90px";
	overlayText.style.textAlign = "left";
	overlayText.style.color = "#E4E4E4";
	overlayText.style.zIndex = "9999999";
	overlayText.style.fontSize = "16px";
	overlayText.innerHTML = "Sync complete! Refresh page.";
	overlayText.classList.add("element-animation");
	document.body.appendChild(overlayText);
}

function isUserLoggedIntoMint() {
	let navBar = document.getElementsByClassName("navbar-nav");
	if (navBar.length > 0) {
		return true;
	}
	return false;
}

// Calculate value of the coins using the Binance API
async function updateMintAccount(coinData, closeTabWhenDone) {
	// Add a visual overlay on top of the page.
	// Overlay will be removed once the Mint
	// account is updated.
	addOverlay();

	// Go to the mint overview page (in case we are another page on Mint.com e.g. https://mint.intuit.com/settings)
	goToMintOverviewPage();

	let cryptoValue = await calculateValueOfUserCrypto(coinData);

	setTimeout(function () {
		if (doesMintCryptoPropertyExist()) {
			editMintProperty(cryptoValue, closeTabWhenDone);
		} else {
			createMintProperty(cryptoValue, closeTabWhenDone);
		}
	}, 3000);

	return true;
}

// Used to grab data from chrome.storage
// Made the function this way so we could use "await",
// as you cannot use await with chrome.storage.sync.get() directly
async function getLocalStorageValue(key) {
	return new Promise((resolve, reject) => {
		try {
			chrome.storage.sync.get(key, function (value) {
				resolve(value);
			});
		} catch (ex) {
			reject(ex);
		}
	});
}

async function calculateValueOfUserCrypto(coinData) {
	// For each coin, get the current price from Binance API.
	// Then calculate the value (current price X quantity)
	let stringAPI = "";
	let price = "";
	let key = "";
	let coinValue = 0;
	let sum = 0;
	let response = 1;

	for (let i = 0; i < coinData.length; i++) {
		// Fetch price data
		stringAPI = "https://api.binance.us/api/v3/avgPrice?symbol=" + coinData[i].coinName + "USD";
		price = await fetch(stringAPI);
		price = await price.json();

		// Calculate value
		coinValue = (coinData[i].coinQuantity * price.price).toFixed(2);
		sum += Number(coinValue);
	}

	sum = sum.toFixed(2);

	// Convert sum from USD to another currency if neccessary

	// Grab userCurrencySymbol from chrome.storage if it exists (if not, set it to USD)
	const chromeResponse = await getLocalStorageValue("userCurrencySymbol");
	userCurrencySymbol = chromeResponse.userCurrencySymbol;
	if (userCurrencySymbol === undefined) {
		userCurrencySymbol = "USD"; // symbol will be undefined if user never changes it bc it is not set in chrome.storage
	}

	// Use Free Currency Converter API to get the ratio of converting USD to the desired currency,
	// then multiply sum times that value before adding it to Mint
	if (userCurrencySymbol != "USD") {
		key = "USD_" + userCurrencySymbol;
		response = await fetch(
			"https://free.currconv.com/api/v7/convert?q=" + key + "&compact=ultra&apiKey=" + secrets.currencyConverterApiKey
		);
		response = await response.json();
		sum = sum * response[key];
	}

	return sum;
}

// Scrub the web page to check if there is a property named "Cryptocurrency"
function doesMintCryptoPropertyExist() {
	let mintAccounts = document.getElementsByClassName("accountName");
	for (let i = 0; i < mintAccounts.length; i++) {
		if (mintAccounts[i].innerText == "Cryptocurrency") {
			return true;
		}
	}
	return false;
}

// Create a property named "Cryptocurrency" in Mint with the calculated crypto value
function createMintProperty(cryptoValue, closeTabWhenDone) {
	// Clicking through the process of adding a property in Mint
	let addAccountButton = document.getElementById("link-addaccount");
	addAccountButton.click();

	let addPropertyButton = document.getElementById("addProperty");
	addPropertyButton.click();

	let addCashButton = document.getElementById("addOther");
	addCashButton.click();

	let dropdown = document.getElementsByTagName("select")[0];
	dropdown.value = "20"; // a is the value for "cash" option in the dropdown

	// had to set timeout to wait here. otherwise wasn't working
	setTimeout(() => {
		let nextButton = document.getElementsByClassName("btn btn-primary modal-btn-primary")[0];
		nextButton.click();

		// had to set timeout to wait here. otherwise wasn't working
		setTimeout(() => {
			let propertyName = document.getElementById("propertyName");
			propertyName.value = "Cryptocurrency";

			let propertyValue = document.getElementById("propertyValue");
			propertyValue.value = cryptoValue; // use the crypto value we calculated as the property value

			let submitAddAccountButton = document.getElementsByClassName("btn btn-primary modal-btn-primary addProperty")[0];
			submitAddAccountButton.click();

			setTimeout(() => {
				const currentTime = new Date().toJSON();
				chrome.storage.sync.set({ syncTime: currentTime });

				if (closeTabWhenDone) {
					//console.log("closing tab");
				} else {
					let returnToOverviewButton = document.getElementsByClassName("goToOverivew")[0];
					returnToOverviewButton.click();
					removeOverlay();
				}
			}, 3000);
		}, 3000);
	}, 3000);
}

// Edit the poperty named "Cryptocurrency", update the value to our calculated value
function editMintProperty(cryptoValue, closeTabWhenDone) {
	// Clicking through the process of editing a property in Mint
	let editButton = document.getElementsByClassName("actionsMenuIcon icon icon-gear-gray3")[0];
	editButton.click();
	let editAccountsButton = document.getElementsByTagName("li");
	for (let i = 0; i < editAccountsButton.length; i++) {
		if (editAccountsButton[i].innerText == "EDIT") {
			editAccountsButton[i].click();
		}
	}

	// wait for element to load
	setTimeout(() => {
		// click cryptocurrency property so we can edit it
		let allSpanElements = document.getElementsByTagName("span");
		for (let i = 0; i < allSpanElements.length; i++) {
			if (allSpanElements[i].innerText == "Cryptocurrency") {
				allSpanElements[i].click();
			}
		}

		// wait for element to load
		setTimeout(() => {
			// update property value
			let allInputElements = document.getElementsByTagName("input");
			for (let i = 0; i < allInputElements.length; i++) {
				if (allInputElements[i].value == "Cryptocurrency") {
					allInputElements[i + 1].value = cryptoValue;
				}
			}

			// click save button
			// have to make the Save button clickable by removing "disabled" attribute
			let allLinkElements = document.getElementsByTagName("a");
			for (let i = 0; i < allLinkElements.length; i++) {
				if (allLinkElements[i].hasAttribute("disabled")) {
					allLinkElements[i].removeAttribute("disabled");
					allLinkElements[i].click();
				}
			}

			// wait for element to load
			setTimeout(() => {
				const currentTime = new Date().toJSON();
				chrome.storage.sync.set({ syncTime: currentTime });

				if (closeTabWhenDone) {
					chrome.runtime.sendMessage({ message: "closeTab" });
				} else {
					for (let i = 0; i < allLinkElements.length; i++) {
						if (allLinkElements[i].innerText == "OVERVIEW") {
							allLinkElements[i].click();
							removeOverlay();
							break;
						}
					}
				}
			}, 3000);
		}, 3000);
	}, 3000);
}

// Go to Mint Overview Page
function goToMintOverviewPage() {
	let allLinkElements = document.getElementsByTagName("a");
	for (let i = 0; i < allLinkElements.length; i++) {
		if (allLinkElements[i].innerText == "OVERVIEW") {
			allLinkElements[i].click();
		}
	}
}

// Add a visual overlay:  a transparent black
// <div> over the entire page, and an "Updating..." message
function addOverlay() {
	// Solid color, opaque overlay. Fills the entire page
	var overlayDiv = document.createElement("overlayDiv");
	overlayDiv.setAttribute("id", "overlayDiv");
	overlayDiv.style.width = "100%";
	overlayDiv.style.height = "100%";
	overlayDiv.style.position = "fixed";
	overlayDiv.style.top = "0";
	overlayDiv.style.left = "0";
	overlayDiv.style.backgroundColor = "black";
	overlayDiv.style.color = "black";
	overlayDiv.style.opacity = "0.75";
	overlayDiv.style.zIndex = "99999";
	document.body.appendChild(overlayDiv);

	// Text that displays in the center of the page
	var overlayText = document.createElement("overlayText");
	overlayText.setAttribute("id", "overlayText");
	overlayText.style.position = "fixed";
	overlayText.style.top = "50%";
	overlayText.style.width = "100%";
	overlayText.style.textAlign = "center";
	overlayText.style.color = "WHITE";
	overlayText.style.zIndex = "100000";
	overlayText.style.fontSize = "50px";
	overlayText.innerHTML = "Updating your Mint account...";
	document.body.appendChild(overlayText);

	// Function to update the text every 0.5 seconds, making
	// the ellipses look animated.
	intervalTimer = setInterval(function () {
		animateOverlayEllipses("Updating your Mint account");
	}, 500);
}

// Update the overlay text to make it look like the ellipses are animated.
function animateOverlayEllipses(string) {
	if (typeof animateOverlayEllipses.counter == "undefined") {
		animateOverlayEllipses.counter = 0;
	}
	animateOverlayEllipses.counter++;

	switch (animateOverlayEllipses.counter % 3) {
		case 0:
			document.getElementById("overlayText").innerHTML = string + " º•º";
			break;
		case 1:
			document.getElementById("overlayText").innerHTML = string + " ºº•";
			break;
		case 2:
			document.getElementById("overlayText").innerHTML = string + " •ºº";
			break;
	}
}

// Remove the visual overlay
function removeOverlay() {
	var getOverlayDiv = document.getElementById("overlayDiv");
	var getOverlayText = document.getElementById("overlayText");
	getOverlayDiv.remove();
	getOverlayText.remove();
	clearInterval(intervalTimer);
}
