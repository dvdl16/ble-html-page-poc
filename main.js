/*jshint esversion: 8 */

// Credit to https://github.com/simpleiot/simpleiot/blob/316dc6d84806afdc139f1c9a7c87d75980a534e0/frontend/public/main.js

import {BLE} from "./ble.js";

console.log('running main.js');
document.querySelector('#buttonscan').addEventListener('click', scan);
document.querySelector('#buttondisconnect').addEventListener('click', disconnect);
document.querySelector('#buttonnewwifi').addEventListener('click', configureWifi);

var ble = new BLE(async () => {
  console.log('ready to get state');
  let state = await ble.getState();
  console.log('state:');
  console.log(state);

});



async function scan(){
  try {
    await ble.request();
    let state = await ble.getState();
    // app.ports.portIn.send(state);
  } catch (e) {
    console.log("scanning error: ", e);
  }
}

async function disconnect(){
  try {
    await ble.disconnect();
    let state = await ble.getState();
    // app.ports.portIn.send(state);
  } catch (e) {
    console.log("disconnect error: ", e);
  }
}

async function configureWifi(){

  let data = {
    wifiSSID: "xxxxxxx",
    wifiPass: "xxxxxxxx"
  };

  try {
    await ble.configureWifi(data);
    let state = await ble.getState();
    // app.ports.portIn.send(state);
  } catch (e) {
    console.log("configure GW WiFi error: ", e);
  }
}
