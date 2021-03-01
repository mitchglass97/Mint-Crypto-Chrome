// Popup.jsx is the popup window for our extension.
//
// The popup window shows a form where a user can input
// the symbol and amount of a given cryptocurrency.
// A user can dynamically add or delete the amount of cryptocurrency
// to enter in the form. The minimum amount is 1.
//
// The form can only be submitted if all the inputs are valid,
// meaning that all the coin names match an item in the coinsSupportedOnBinance
// array (which is populated by fetching Binance API for a list of all coins 
// supported by the Binance API) and all the coin amounts are valid numbers greater than 0.
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
//
// The content script will then calculate the value of all the coins
// using price data from the Binance API, then either create or modify a 
// cryptocurrency property in Mint.

import React from "react"
import CoinInputs from "./CoinInputs"
import './Popup.css';
let coinsSupportedOnBinance = [];

class Popup extends React.Component {

  // State includes: 
  // an array of coin objects.
  // an error variable. There are three error states: none, notOnMintURL, & onMintURLButNotLoggedIn
  state = {
    coins: [{coinName:"", coinAmount:"", coinNameValid:false, coinAmountValid:false, submit:false}],
    error: "none"
  }

  // After the component mounts, set state.coin to the data in chrome.storage (if the data exists).
  // When a user successfully submits the popup form, the data (coin names and amounts)
  // is stored in chrome.storage.
  // Also, fetch exchange info from Binance API. We get a JSON response that will
  // tell us all the cryptocurrency symbols currently supported by Binance.
  componentDidMount() {

    // Get user's coin data from Chrome storage
    chrome.storage.sync.get('myCoinData', (data) => {
      if (data.myCoinData) {this.setState({coins: data.myCoinData});}
    });
    
    // Fetch Binance Exchange Info
    fetch(`https://api.binance.com/api/v1/exchangeInfo`)
      .then(res => res.json())
      .then(json => this.handleBinanceData(json));
  }

  // Store all coin symbols supported by Binance in an array.
  // We will check any user-inputted symbols against this array
  handleBinanceData(json) {
    for(let i=0; i<json.symbols.length; i++){
      coinsSupportedOnBinance[i] = json.symbols[i].baseAsset;
    }
  }

  // This function is entered whenever user types into the form.
  // Update the state with user's input.
  // Also check if user's input is valid-- coin name has to match
  // an element in our array of coins supported on Binance, and coin
  // amounts have to be a valid positive number.
  // The form cannot be submitted unless all inputs are valid. If form is
  // submitted with any invalid inputs, those inputs will display an error
  // indicator (red line).
  handleChange = (e) => {

    // Ignore spaces
    if(e.nativeEvent.data == " ") {
      return;
    }

    // Ignore numbers if user is typing into a "coin name" field
    if (["coinName"].includes(e.target.dataset.fieldType)) {
      let reg = new RegExp("[0-9]");
      if(reg.test(e.nativeEvent.data)) {
        if(e.nativeEvent.data != null) {return;}}
    }
    
    // Ignore letters if user is typing into a "coin amount" field
    if (["coinAmount"].includes(e.target.dataset.fieldType)) {
      let reg = new RegExp("[a-zA-Z]");
      if(reg.test(e.nativeEvent.data)) {
        if(e.nativeEvent.data != null) {return;}}
    }

    // Update state.coin with user's input, and check if user's input is valid
    if (["coinName", "coinAmount"].includes(e.target.dataset.fieldType) ) {
      let coins = [...this.state.coins]
      coins[e.target.dataset.id][e.target.dataset.fieldType] = e.target.value.toUpperCase()

      // Input field is a coin name
      // Check if coin name is valid (has to match a symbol in coinList array)
      if (["coinName"].includes(e.target.dataset.fieldType)) {
        if(coinsSupportedOnBinance.includes(coins[e.target.dataset.id][e.target.dataset.fieldType])) {
          coins[e.target.dataset.id].coinNameValid = true;
        } else {
          coins[e.target.dataset.id].coinNameValid = false;
        }
      }

      // Input field is a coin amount
      // Check if input is valid (valid number AND greater than 0)
      if (["coinAmount"].includes(e.target.dataset.fieldType)) {
        if(!isNaN(coins[e.target.dataset.id].coinAmount) && coins[e.target.dataset.id].coinAmount>0) {
          coins[e.target.dataset.id].coinAmountValid = true;
        } else {
          coins[e.target.dataset.id].coinAmountValid = false;
        }
      }
      this.setState({ coins })
    } else {
      this.setState({ [e.target.coinName]: e.target.value.toUpperCase() })
    }
  }

 // This function is entered whenever user submits the form.
  handleSubmit = (e) => {
    e.preventDefault();

    // Set coins.submit to true for all coins. This is used to set
    // error indicators (red color and error text) to the appropriate input fields.
    let coins = [...this.state.coins];
    for(let i=0; i<this.state.coins.length; i++) {
      coins[i].submit = true;
    }
    this.setState({ coins });
  
    // Determine if all fields contain valid inputs (valid coin names and valid coin amounts)
    let allInputsValid = this.state.coins.reduce((sum, next) => sum && next.coinNameValid && next.coinAmountValid, true);
    if(allInputsValid) {
  
      // Send data to the content script via chrome.messaging
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {coinData: this.state.coins}, (response) => {

            // content script did not send a response. user is not on a mint.intuit.com/* URL
            if(response == undefined) {
              this.setState({
                error: "notOnMintURL"
              });
            } 

            // on mint.intuit.com but not logged in
            else if (response.loggedIn == false) {
              this.setState({
                error: "onMintURLButNotLoggedIn"
              });
            }
            // logged into Mint.com
            else {
              this.setState({
                error: "none"
              });

              // Set submit to false for all coins to clear error indicators 
              // on any inputs that previously had them
              let coins = [...this.state.coins]
              for(let i=0; i<this.state.coins.length; i++) {
                coins[i].submit = false;
              }
              // Save coin data to chrome.storage
              chrome.storage.sync.set({'myCoinData': this.state.coins}, function() {
                console.log('Settings saved');
              });
              window.close(); // close the popup window
            }
        });
    });}
  }

  // Add a new coin object
  addCoin() {
    this.setState((prevState) => ({
      coins: [...prevState.coins, {coinName:"", coinAmount:"", coinNameValid:false, coinAmountValid:false, submit:false}],
    }));
  }

  // Delete a specified coin object
  deleteCoin(index){
    if(this.state.coins.length > 1) {
      let tempCoins = [...this.state.coins];
      tempCoins.splice(index,1);
      this.setState({
        coins: tempCoins
      });
    }
  }

render() {
    let	deleteCoin	=	this.deleteCoin;
    let	addCoin	=	this.addCoin;
    let {coins} = this.state;
    let error = this.state.error;
    let submitButtonText;
    let myClass="submit";
    
    // Change submit button text based on error state
    switch(error) {
      case "notOnMintURL":
        submitButtonText = "Error! - Please log into Mint.com (If you are logged into Mint.com, please refresh the page)"
        myClass="submit error";
        break;
      case "onMintURLButNotLoggedIn":
        submitButtonText = "Error! - Please log into Mint.com"
        myClass="submit error";
        break;
      // no error
      default:
        submitButtonText = "Sync to Mint"
    }

    return ( 
      <div className="popUpContainer">
        <div className="headerContainer">
          <h1>Mint Crypto</h1>
        </div>
        <div className="formContainer">
          <form onSubmit={this.handleSubmit} onChange={this.handleChange} className="myForm">
            <CoinInputs 
              coins={coins} 
              deleteCoin = {deleteCoin.bind(this)} 
              addCoin = {addCoin.bind(this)}
            />
          </form>
          <div className="submitContainer">
            <input onClick={this.handleSubmit} type="submit" value={submitButtonText} className={myClass}/> 
          </div>
        </div>
      </div>
    )
  }
}
export default Popup