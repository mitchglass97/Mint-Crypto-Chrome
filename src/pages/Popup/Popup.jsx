// Popup.jsx is the popup window for our extension.
//
// The popup window shows a form where a user can input
// the symbol and quantity of a given cryptocurrency.
// A user can dynamically add or delete the # of cryptocurrencies
// to enter in the form. The minimum # is 1.
//
// The form can only be submitted if all the inputs are valid,
// meaning that all the coin names match an item in the coinsSupportedOnBinance
// array (which is populated by fetching Binance API for a list of all coins
// supported by the Binance API) and all the coin quantity are valid numbers greater than 0.
//
// Once the form is submitted, a message is sent to the content script
// with an array of all the coin objects. If no response is received from the
// content script, popup will display an error and tell the user that they
// must be logged into Mint.com.
//
// If popup sends a message to the content script while user is on the Mint.com
// homepage but NOT Logged in, the content script will receive the message
// but send a response of {loggedIn: false}. popup will display an error and
// tell the user that they must be logged into Mint.com.
//
// The content script will then calculate the value of all the coins
// using price data from the Binance API, then either create or modify a
// cryptocurrency property in Mint.

import React from "react";
import CoinInputs from "./CoinInputs";
import "./Popup.css";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
let coinsSupportedOnBinance = [];

class Popup extends React.Component {
	// State is:
	// 1) an array of coin objects.
	// 2) a string for error state. There are three error states: none, notOnMintURL, & onMintURLButNotLoggedIn
	state = {
		coins: [
			{
				coinName: "",
				coinQuantity: "",
				isCoinNameValid: false,
				isCoinQuantityValid: false,
				hasFormBeenSubmitted: false,
			},
		],
		error: "none",
		userCurrencySymbol: "USD",
	};

	// theme for currency select dropdown (Materials UI) to use
	theme = createMuiTheme({
		typography: {
			fontFamily: "Heebo, sans-serif",
		},
		palette: {
			primary: {
				main: "#06B6C9",
			},
		},
	});

	// After the component mounts, set state.coin to the data in chrome.storage (if the data exists).
	// When a user successfully submits the popup form, the data (coin names and quantities)
	// is stored in chrome.storage.
	// Also, fetch exchange info from Binance API. We get a JSON response that will
	// tell us all the cryptocurrency symbols currently supported by Binance.
	componentDidMount() {
		// Get user's coin data from Chrome storage
		chrome.storage.sync.get("userSubmittedCoinData", (data) => {
			if (data.userSubmittedCoinData) {
				this.setState({ coins: data.userSubmittedCoinData });
			}
		});

		chrome.storage.sync.get("userCurrencySymbol", (data) => {
			if (data.userCurrencySymbol) {
				this.setState({
					userCurrencySymbol: data.userCurrencySymbol,
				});
			} else {
				this.setState({
					userCurrencySymbol: "USD",
				});
			}
		});

		// Fetch list of supported coins from Binance API
		fetch(`https://api.binance.com/api/v1/exchangeInfo`)
			.then((res) => res.json())
			.then((json) => this.createArrayOfCoinsSupportedOnBinance(json));
	}

	// Store all coin symbols supported by Binance in an array.
	// We will check any user-inputted coin names against this array
	createArrayOfCoinsSupportedOnBinance(json) {
		for (let i = 0; i < json.symbols.length; i++) {
			coinsSupportedOnBinance[i] = json.symbols[i].baseAsset;
		}
	}

	// This function is entered whenever user types into the form.
	// Update the state with user's input.
	// Also check if user's input is valid-- coin name has to match
	// an element in our array of coins supported on Binance, and coin
	// quantities have to be a valid positive number.
	// The form cannot be submitted unless all inputs are valid. If form is
	// submitted with any invalid inputs, those inputs will display an error
	// indicator (red line).
	handleChangeForm = (e) => {
		// Ignore spaces, numbers typed into a "name" input, and letters into a "quantity" input
		if (this.isUserTypingSpaces(e) | this.isUserTypingNumbersIntoNameField(e) | this.isUserTypingLettersIntoQuantityField(e)) {
			return;
		}

		this.updateCoinState(e);
	};

	isUserTypingSpaces = (e) => {
		if (e.nativeEvent.data == " ") {
			return true;
		}
		return false;
	};

	isUserTypingNumbersIntoNameField = (e) => {
		if (["coinName"].includes(e.target.dataset.fieldType)) {
			let reg = new RegExp("[0-9]");
			if (reg.test(e.nativeEvent.data)) {
				if (e.nativeEvent.data != null) {
					return true;
				}
			}
		}
		return false;
	};

	isUserTypingLettersIntoQuantityField = (e) => {
		if (["coinQuantity"].includes(e.target.dataset.fieldType)) {
			let reg = new RegExp("[a-zA-Z]");
			if (reg.test(e.nativeEvent.data)) {
				if (e.nativeEvent.data != null) {
					return true;
				}
			}
		}
		return false;
	};

	// Update state.coin
	updateCoinState = (e) => {
		if (["coinName", "coinQuantity"].includes(e.target.dataset.fieldType)) {
			let coins = [...this.state.coins];
			coins[e.target.dataset.id][e.target.dataset.fieldType] = e.target.value.toUpperCase();

			// Input field is a coin name
			// Check if coin name is valid (has to match a symbol in coinList array)
			if (["coinName"].includes(e.target.dataset.fieldType)) {
				if (this.checkIfCoinNameIsValid(e, coins)) {
					coins[e.target.dataset.id].isCoinNameValid = true;
				} else {
					coins[e.target.dataset.id].isCoinNameValid = false;
				}
			}

			// Input field is a coin quantity
			// Check if input is valid (valid number AND greater than 0)
			if (["coinQuantity"].includes(e.target.dataset.fieldType)) {
				if (this.checkIfCoinQuantityIsValid(e, coins)) {
					coins[e.target.dataset.id].isCoinQuantityValid = true;
				} else {
					coins[e.target.dataset.id].isCoinQuantityValid = false;
				}
			}
			this.setState({ coins });
		} else {
			this.setState({ [e.target.coinName]: e.target.value.toUpperCase() });
		}
	};

	checkIfCoinNameIsValid = (e, coins) => {
		if (coinsSupportedOnBinance.includes(coins[e.target.dataset.id][e.target.dataset.fieldType])) {
			return true;
		} else {
			return false;
		}
	};

	checkIfCoinQuantityIsValid = (e, coins) => {
		if (!isNaN(coins[e.target.dataset.id].coinQuantity) && coins[e.target.dataset.id].coinQuantity > 0) {
			return true;
		} else {
			return false;
		}
	};

	handleChangeCurrencySymbol = (e) => {
		e.preventDefault();
		this.setState({
			userCurrencySymbol: e.target.value,
		});
	};

	// This function is entered whenever user submits the form.
	handleSubmitForm = (e) => {
		e.preventDefault();

		// Set coins.hasFormBeenSubmitted to true for all coins. This is used by <CoinInputs> component
		// to set error indicators (red color) to the invalid input fields on a form submit
		this.setSubmitToTrueForAllCoins();

		// Determine if all fields contain valid inputs (valid coin name quantity)
		let allInputsAreValid = this.state.coins.reduce((sum, next) => sum && next.isCoinNameValid && next.isCoinQuantityValid, true);
		if (allInputsAreValid) {
			chrome.runtime.sendMessage({ message: "popupSync" }); // tell background script that we are about to run a sync => so ignore any URL changes for 1 minute

			setTimeout(() => {
				// Send data to the content script via chrome.messaging
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					chrome.tabs.sendMessage(tabs[0].id, { coinData: this.state.coins }, (response) => {
						// content script did not send a response = user is not on a mint.intuit.com/* URL
						// do nothing besides change state.error
						if (response == undefined) {
							this.setState({
								error: "notOnMintURL",
							});
						}

						// content script sent a response but user is NOT logged into Mint so content script
						// cannot do its job
						else if (response.loggedIn == false) {
							this.setState({
								error: "onMintURLButNotLoggedIn",
							});
						}
						// content script sent a response. user is logged into Mint.com.
						// content script will take it from here
						// save user's coin data to Chrome Storage and close pop-up window.
						else {
							this.setState({
								error: "none",
							});

							this.saveDataToChromeStorage();
							this.closePopUpWindow();
						}
					});
				});
			}, 250);
		}
	};

	setSubmitToTrueForAllCoins() {
		let coins = [...this.state.coins];
		for (let i = 0; i < this.state.coins.length; i++) {
			coins[i].hasFormBeenSubmitted = true;
		}
		this.setState({ coins });
	}

	closePopUpWindow() {
		window.close();
	}

	saveDataToChromeStorage() {
		chrome.storage.sync.set({ userSubmittedCoinData: this.state.coins, userCurrencySymbol: this.state.userCurrencySymbol }, function () {
			//console.log("Settings saved");
		});
	}

	// Add a new coin object
	addCoin() {
		this.setState((prevState) => ({
			coins: [
				...prevState.coins,
				{
					coinName: "",
					coinQuantity: "",
					isCoinNameValid: false,
					isCoinQuantityValid: false,
					hasFormBeenSubmitted: false,
				},
			],
		}));
	}

	// Delete a specified coin object
	deleteCoin(index) {
		if (this.state.coins.length > 1) {
			let tempCoins = [...this.state.coins];
			tempCoins.splice(index, 1);
			this.setState({
				coins: tempCoins,
			});
		}
	}

	render() {
		let deleteCoin = this.deleteCoin;
		let addCoin = this.addCoin;
		let { coins } = this.state;
		let error = this.state.error;
		let submitButtonText;
		let submitButtonClass = "submit";

		// Change submit button text based on error state
		switch (error) {
			case "notOnMintURL":
				submitButtonText = "Error! - Please log into Mint.com (If you are logged into Mint.com, please refresh the page)";
				submitButtonClass = "submit error";
				break;
			case "onMintURLButNotLoggedIn":
				submitButtonText = "Error! - Please log into Mint.com";
				submitButtonClass = "submit error";
				break;
			// no error
			default:
				submitButtonText = "Sync to Mint";
		}

		return (
			<div className='popUpContainer'>
				<div className='headerContainer'>
					<h1>Mint Crypto</h1>
				</div>
				<div className='formContainer'>
					<form onSubmit={this.handleSubmitForm} onChange={this.handleChangeForm} className='myForm'>
						<CoinInputs coins={coins} deleteCoin={deleteCoin.bind(this)} addCoin={addCoin.bind(this)} />
					</form>
					<div className='submitContainer'>
						<input
							onClick={this.handleSubmitForm}
							type='submit'
							value={submitButtonText}
							className={submitButtonClass}
						/>
					</div>
					<ThemeProvider theme={this.theme}>
						<InputLabel id='currency-symbol-dropdown'>
							Currency of your Mint account (Mint Crypto will calculate the value of your crypto in this
							currency)
						</InputLabel>
						<Select
							labelId='currency-symbol-select-label'
							id='currency-symbol-select'
							value={this.state.userCurrencySymbol}
							onChange={this.handleChangeCurrencySymbol}
						>
							<MenuItem value={"USD"}>USD</MenuItem>
							<MenuItem value={"CAD"}>CAD</MenuItem>
							<MenuItem value={"AUD"}>AUD</MenuItem>
							<MenuItem value={"EUR"}>EUR</MenuItem>
							<MenuItem value={"INR"}>INR</MenuItem>
							<MenuItem value={"GBP"}>GBP</MenuItem>
							<MenuItem value={"CNY"}>CNY</MenuItem>
							<MenuItem value={"JPY"}>JPY</MenuItem>
							<MenuItem value={"MXN"}>MXN </MenuItem>
							<MenuItem value={"CHF"}>CHF</MenuItem>
						</Select>
					</ThemeProvider>
				</div>
			</div>
		);
	}
}
export default Popup;
