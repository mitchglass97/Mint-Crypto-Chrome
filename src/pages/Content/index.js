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

// Listener to receive a message from Popup
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        setTimeout(function() {
            if(isLoggedIntoMint()) {
                sendResponse({loggedIn: true});
                calculateCryptoValue(message.coinData);
            } else {
                sendResponse({loggedIn: false});
            }
        }, 100);
        return true;
}); 

function isLoggedIntoMint() {
    let navBar = document.getElementsByClassName("navbar-nav");
    if(navBar.length > 0) {
        return true;
    }
    return false;
}

// Calculate value of the coins using the Binance API
async function calculateCryptoValue(coinData) {

    // Add a visual overlay on top of the page.
    // Overlay will be removed once the Mint
    // account is updated.
    addOverlay();

    // For each coin, get the current price from Binance API.
    // Then calculate the value (current price X amount)
    let stringAPI = "";
    let price = "";
    let coinValue = 0;
    let sumAllCoins=0;
    for(let i=0; i<coinData.length; i++) {

        // Fetch price data 
        stringAPI = "https://api.binance.us/api/v3/avgPrice?symbol=" + coinData[i].coinName + "USD";
        price = await fetch(stringAPI);
        price = await price.json();

        // Calculate value
        coinValue = (coinData[i].coinAmount*price.price).toFixed(2);
        console.log("value of " + coinData[i].coinAmount + " " + coinData[i].coinName + " at price of " + price.price + " per coin is: " + coinValue);
        sumAllCoins += Number(coinValue);
    }
    sumAllCoins = sumAllCoins.toFixed(2);

    // Go to the mint overview page (in case we are another page on Mint.com e.g. https://mint.intuit.com/settings)
    goToMintOverviewPage();

    setTimeout(function(){ 
        // Using the calculated value, either create or update existing "Cryptocurrency" property
        // depending on whether it exists
        if(doesMintCryptoPropertyExist()) {
            editMintProperty(sumAllCoins);
        } else {
            addMintProperty(sumAllCoins);
        }
    }, 3000);
}

// Scrub the web page to check if there is a property named "Cryptocurrency"
function doesMintCryptoPropertyExist() {
    let mintAccounts = document.getElementsByClassName("accountName");
    for(let i=0; i<mintAccounts.length; i++) {
        if(mintAccounts[i].innerText == "Cryptocurrency") {
            return true;
        }
    }
    return false;
}

// Create a property named "Cryptocurrency" in Mint with the calculated value
function addMintProperty(sumAllCoins) {

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
            propertyValue.value = sumAllCoins; // use the crypto value we calculated as the property value

            let submitAddAccountButton = document.getElementsByClassName("btn btn-primary modal-btn-primary addProperty")[0];
            submitAddAccountButton.click();

            setTimeout(() => { 
                let returnToOverviewButton = document.getElementsByClassName("goToOverivew")[0];
                returnToOverviewButton.click();
                removeOverlay();
            }, 3000);
            
        }, 3000);
    }, 3000);
}

// Edit the poperty named "Cryptocurrency", update the value to our calculated value
function editMintProperty(sumAllCoins) {

    // Clicking through the process of editing a property in Mint
    let editButton = document.getElementsByClassName("actionsMenuIcon icon icon-gear-gray3")[0];
    editButton.click();
    let editAccountsButton = document.getElementsByTagName("li");
    for(let i=0; i<editAccountsButton.length; i++) {
        if(editAccountsButton[i].innerText == "EDIT") {
            editAccountsButton[i].click();
        }  
    }

    // wait for element to load
    setTimeout(() => { 

        // click cryptocurrency property so we can edit it
        let allSpanElements = document.getElementsByTagName("span");
        for(let i=0; i<allSpanElements.length; i++) {
            if(allSpanElements[i].innerText == "Cryptocurrency") {
                allSpanElements[i].click();
            }  
        }

        // wait for element to load
        setTimeout(() => { 

            // update property value
            let allInputElements = document.getElementsByTagName("input");
            for(let i=0; i<allInputElements.length; i++) {
                if(allInputElements[i].value == "Cryptocurrency") {
                    allInputElements[i+1].value = sumAllCoins;
                }
            }
            
            // click save button
            // have to make the Save button clickable by removing "disabled" attribute
            let allLinkElements = document.getElementsByTagName("a");
            for(let i=0; i<allLinkElements.length; i++) {
                if(allLinkElements[i].hasAttribute("disabled")) {
                    allLinkElements[i].removeAttribute("disabled");
                    allLinkElements[i].click();
                }
            }

            // wait for element to load
            setTimeout(() => { 
                for(let i=0; i<allLinkElements.length; i++) {
                    if(allLinkElements[i].innerText == "OVERVIEW") {
                        allLinkElements[i].click();
                        removeOverlay();
                    }
                }
            }, 3000);

        }, 3000);

    }, 3000);
}

// Go to Mint Overview Page
function goToMintOverviewPage() {
    let allLinkElements = document.getElementsByTagName("a");
    for(let i=0; i<allLinkElements.length; i++) {
        if(allLinkElements[i].innerText == "OVERVIEW") {
            allLinkElements[i].click();
        }
    }
}


// Add a visual overlay:  a transparent black 
// <div> over the entire page, and an "Updating..." message
function addOverlay() {

    // Solid color, opaque overlay. Fills the entire page
    var overlayDiv = document.createElement("overlayDiv");
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
    intervalTimer = setInterval(animateOverlayEllipses, 500);
}

// Update the overlay text to make it look like the ellipses are animated.
function animateOverlayEllipses(){

    if( typeof animateOverlayEllipses.counter == 'undefined' ) {
        animateOverlayEllipses.counter = 0;
    }
    animateOverlayEllipses.counter++;

    switch(animateOverlayEllipses.counter%3) {
        case 0:
            document.getElementById("overlayText").innerHTML="Updating your Mint account...";
            break;
        case 1:
            document.getElementById("overlayText").innerHTML="Updating your Mint account.&nbsp;&nbsp;";
            break;
        case 2:
            document.getElementById("overlayText").innerHTML="Updating your Mint account..&nbsp;";
            break;
        } 
}

// Remove the visual overlay
function removeOverlay() {
    var getOverlayDiv = document.getElementsByTagName("overlayDiv")[0];
    var getOverlayText = document.getElementsByTagName("overlayText")[0];
    getOverlayDiv.remove();
    getOverlayText.remove();
    clearInterval(intervalTimer);
}