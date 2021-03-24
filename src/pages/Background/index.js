// Background script

let mintCheckBuffer = false;

// Listener to receive messages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	// Message from Content script telling us to close whatever tab the message came from
	if (message.message == "closeTab") {
		chrome.tabs.remove(sender.tab.id, () => {
			// Tell the current content script that the sync is complete
			chrome.storage.sync.get(["originTab"], function (result) {
				chrome.tabs.sendMessage(result.originTab, { fromBackground: "syncComplete" }, (response) => {
					//console.log(response);
				});
			});
		});
	}
	// Message from Content script telling us that user is logged into Mint
	// Run auto sync if conditions are met:
	//
	// 1) user has coin data saved (has done first-time setup)'
	// 2) has been over 30 minutes since last sync
	else if (message.message == "loggedIntoMint") {
		if (mintCheckBuffer == false) {
			mintCheckBuffer = true;
			setTimeout(function () {
				mintCheckBuffer = false;
			}, 30000);
			chrome.storage.sync.get("userSubmittedCoinData", (data) => {
				if (data.userSubmittedCoinData) {
					chrome.storage.sync.set({ originTab: sender.tab.id }, function () {
						//console.log(tabId);
					});

					// Check if its been over 30 minutes since last sync
					chrome.storage.sync.get(["syncTime"], (result) => {
						const storedJSONDate = result["syncTime"];
						const storedDate = new Date(storedJSONDate);
						let currentDate = new Date();
						const diffTime = Math.abs((currentDate - storedDate) / (1000 * 60));

						if (isNaN(diffTime) || diffTime > 30) {
							// tell Content script to display a message on that page saying that we are syncing
							chrome.tabs.sendMessage(
								sender.tab.id,
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
														fromBackground: "runUpdateScript",
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
						}
					});
				}
			});
		}
	}
});
