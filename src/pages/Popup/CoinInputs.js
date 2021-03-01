// CoinInputs is a component used in the popup.
// In each CoinInputs are two TextField elements for the user to
// input the name and amount of the coin.
//
// Each CoinInputs has two additional elements that display conditionally:
// 1) A "Delete Coin" button. This removes the target coin from the popup state
//    If there is only one coin, a disabled/inactive delete button will appear.
//
// 2) An "Add Coin" button. This adds one empty coin object
//    to the popup state
//
// A TextField will display an error only if it contains
// an invalid input AND it existed when the form was last submitted.

import React from "react"
import './Popup.css';
import TextField from '@material-ui/core/TextField';
import { createMuiTheme, ThemeProvider} from '@material-ui/core/styles';

const CoinInputs = (props) => {

  // Override some of the styles of TextField component from Material-UI
  const theme = createMuiTheme({
    typography: {
      "fontFamily": "Heebo, sans-serif"
    },
    palette: {
      primary: {
        main: "#06B6C9"
      }
    }
  });

  return (
    props.coins.map((val, idx)=> {
      let coinID = `coin-${idx}`, coinAmountId = `coinAmount-${idx}`
      var	deleteCoin	=	props.deleteCoin;
      var	addCoin	=	props.addCoin;

      return (
        <div className="coinContainer" key={idx}>
          <div className="coinInputsContainer">
            <ThemeProvider theme={theme}>
              <TextField
                error={!props.coins[idx].coinNameValid && props.coins[idx].submit}
                type="text"
                name={coinID}
                id={coinID}
                value={props.coins[idx].coinName} 
                inputProps={{"data-id": idx, "data-field-type": "coinName", className: "textFieldInput"}}
                autoComplete="off"
                spellCheck="false"
                variant="filled"
                label="Coin"
                className="TextField"
                InputLabelProps={{className: "textFieldLabel"}}
              />
            <TextField
              error={!props.coins[idx].coinAmountValid && props.coins[idx].submit}
              type="text"
              name={coinAmountId}
              id={coinAmountId}
              value={props.coins[idx].coinAmount} 
              inputProps={{"data-id": idx, "data-field-type": "coinAmount", className: "textFieldInput"}}
              autoComplete="off"
              spellCheck="false"
              variant="filled"
              label="Quantity"
              className="TextField"
              InputLabelProps={{className: "textFieldLabel"}}
            />
            </ThemeProvider>
          </div>
          { // Display a disabled delete button next to the first coin (if it is the only coin)
            props.coins.length == 1 &&
            <button onClick={() => deleteCoin(idx)} type="button" className="coinButton delete disabled">Delete</button>
          }
          { // Display a delete button on last coin (if there is more than 1 coin)
            props.coins.length > 1 && idx == props.coins.length-1 &&
            <button onClick={() => deleteCoin(idx)} type="button" className="coinButton delete">Delete</button>
          }
          { // Display a delete button on all coins except the first coin. the #left class
            // moves the delete button to the left on rows that don't have "Add Coin" button
            props.coins.length > 1 && idx != props.coins.length-1 &&
            <button onClick={() => deleteCoin(idx)} type="button" className="coinButton delete left">Delete</button>
          }
          { // Display an Add Coin button next to the last coin
            props.coins.length-1 == idx &&
            <button onClick={() => addCoin()} type="button " className="coinButton add">Add a Coin</button>
          }
        </div>
      )
    })
  )
}
export default CoinInputs