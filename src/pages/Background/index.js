// Background script

let mintCheckBuffer = false; // boolean used as a buffer. when we check if current URL matches
let originTab = 999; // we set this variable to the ID of whatever tab user is on when they log into Mint (used to send messages to the correct originating tab)

// Listener to receive messages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	// Message from Content script telling us to close whatever tab the message came from
	if (message.message == "closeTab") {
		chrome.tabs.remove(sender.tab.id, () => {
			// Tell the current content script that the sync is complete

			chrome.storage.sync.get(["originTab"], function (result) {
				console.log("getting origin tab value currently is " + result.originTab);
				chrome.tabs.sendMessage(result.originTab, { fromBackground: "syncComplete" }, (response) => {
					//console.log(response);
				});
			});
		});
	}

	// Message from Popup script telling user initiated a sync from Popup.
	// We set mintCheckBuffer to true for 1 minute so that the background script
	// ignores any URL changes from the popup sync that would prompt an automatic sync
	else if (message.message == "popupSync") {
		mintCheckBuffer = true;
		setTimeout(function () {
			setMintCheckBufferFalse();
		}, 60000);
	}
});

// Listener triggered whenever user navigates to a new URL in a tab
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
	chrome.storage.sync.get("userSubmittedCoinData", (data) => {
		// only attempt to run an auto-update if there is coin data saved
		if (data.userSubmittedCoinData) {
			if (tab.active) {
				let mintLoggedInURLTest = new RegExp("https://mint.intuit.com/.");

				// Check if user is logged into mint
				if (mintLoggedInURLTest.test(tab.url) && mintCheckBuffer == false) {
					chrome.storage.sync.set({ originTab: tabId }, function () {
						console.log("setting origin tab value is set to " + tabId);
					});

					mintCheckBuffer = true;
					setTimeout(function () {
						setMintCheckBufferFalse();
					}, 30000);

					// Check if its been over 30 minutes hour since last sync
					chrome.storage.sync.get(["syncTime"], (result) => {
						const storedJSONDate = result["syncTime"];
						const storedDate = new Date(storedJSONDate);
						let currentDate = new Date();
						const diffTime = Math.abs((currentDate - storedDate) / (1000 * 60));
						//console.log(diffTime + " minutes since last sync");

						if (isNaN(diffTime) || diffTime > 3) {
							setTimeout(() => {
								// tell Content script to display a message we are syncing
								chrome.tabs.sendMessage(
									tabId,
									{ fromBackground: "displaySyncingOnActive" },
									(response) => {
										///console.log(response);
									}
								);

								// create a new tab
								chrome.tabs.create(
									{
										url: "https://mint.intuit.com/overview.event",
										active: false,
									},
									(tab) => {
										// wait a few seconds
										setTimeout(() => {
											// Tell new tab to run the content script for updating mint account
											let coinMessage = {};

											chrome.storage.sync.get("userSubmittedCoinData", (data) => {
												if (data.userSubmittedCoinData) {
													coinMessage = data.userSubmittedCoinData;

													chrome.tabs.sendMessage(
														tab.id,
														{
															fromBackground:
																"runUpdateScript",
															coinMessage: coinMessage,
														},
														(response) => {
															//console.log(response);
														}
													);
												}
											});
										}, 3000);
									}
								);
							}, 3000);
						}
					});
				}
			}
		}
	});
});

function setMintCheckBufferFalse() {
	mintCheckBuffer = false;
}
