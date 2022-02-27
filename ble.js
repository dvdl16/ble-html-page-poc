/*jshint esversion: 8 */

// Credit to https://github.com/simpleiot/simpleiot/blob/master/frontend/public/ble.js

const serviceUuid = "5c1b9a0d-b5be-4a40-8f7a-66b36d0a5176";
const charModelUuid = "fdcf0003-3fed-4ed2-84e6-04bbb9ae04d4";
const charWifiSSIDUuid = "fdcf0004-3fed-4ed2-84e6-04bbb9ae04d4";
const charConnectedUuid = "fdcf0005-3fed-4ed2-84e6-04bbb9ae04d4";
const charSetWifiSSIDUuid = "fdcf0006-3fed-4ed2-84e6-04bbb9ae04d4";
const charSetWifiPassUuid = "fdcf0007-3fed-4ed2-84e6-04bbb9ae04d4";
const charDeviceIDUuid = "fdcf0009-3fed-4ed2-84e6-04bbb9ae04d4";

export class BLE {
  constructor(stateChanged) {
    console.log('constructing BLE');
    this.resetState();
    this.stateChanged = stateChanged;
  }

  resetState() {
    console.log('resetState');
    this.device = null;
    this.server = null;
    this.service = null;
    this.connected = false;
  }

  onDisconnected() {
    console.log('onDisconnected');
    this.resetState();
    this.stateChanged();
  }

  onConnectedChanged(event) {
    console.log('onConnectedChanged');
    let {value} = event.target;
    this.connected = value.getUint8();
    if (this.connected) {
      this.connected = true;
    } else {
      this.connected = false;
    }
    console.log("onConnectedChanged: ", value.getUint8());
    this.stateChanged();
  }

  async configureWifi(config) {
    console.log('configureWifi');
    if (!this.device) {
      throw "configure GW, no device";
    }

    const charSetWifiSSID = await this.service.getCharacteristic(charSetWifiSSIDUuid);
    const encoder = new TextEncoder();
    charSetWifiSSID.writeValue(encoder.encode(config.wifiSSID));

    const charSetWifiPass = await this.service.getCharacteristic(charSetWifiPassUuid);
    charSetWifiPass.writeValue(encoder.encode(config.wifiPass));
  }


  async getState() {
    console.log("getState: service: ", this.service);
    let ret = {
      connected: this.connected,
      bleConnected: false,
      ssid: "",
      pass: "",
      model: "",
      deviceid: ""
    };

    if (this.device && this.device.gatt.connected) {
      ret.bleConnected = true;
    }

    if (!ret.bleConnected) {
      // Nothing more to do
      return ret;
    }

    const modelChar = await this.service.getCharacteristic(charModelUuid);
    let buf = await modelChar.readValue();
    const decoder = new TextDecoder("utf-8");
    ret.model = decoder.decode(buf);

    const ssidChar = await this.service.getCharacteristic(charWifiSSIDUuid);
    buf = await ssidChar.readValue();
    ret.ssid = decoder.decode(buf);

    const deviceidChar = await this.service.getCharacteristic(charDeviceIDUuid);
    buf = await deviceidChar.readValue();
    ret.deviceid = decoder.decode(buf);

    console.log(ret);

    return ret;
  }

  async request() {
    console.log('request');
    let options = {
      acceptAllDevices: true,
      optionalServices: [serviceUuid]
    };
    if (navigator.bluetooth == undefined) {
      alert("Sorry, Your device does not support Web BLE!");
      return;
    }

    try {
      if (this.device && this.device.gatt.connected) {
        await this.device.gatt.disconnect();
      }

      this.device = await navigator.bluetooth.requestDevice(options);
      if (!this.device) {
        throw "No device selected";
      }

      this.device.addEventListener(
        "gattserverdisconnected",
        this.onDisconnected.bind(this)
      );

      this.server = await this.device.gatt.connect();
      this.service = await this.server.getPrimaryService(serviceUuid);

      console.log("got service");

      const connectedChar = await this.service.getCharacteristic(charConnectedUuid);
      let buf = await connectedChar.readValue();
      this.connected = buf.getUint8();

      if (this.connected) {
        this.connected = true;
      } else {
        this.connected = false;
      }

      const connectChar = await this.service.getCharacteristic(charConnectedUuid);
      await connectChar.startNotifications();
      connectChar.addEventListener(
        "characteristicvaluechanged",
        this.onConnectedChanged.bind(this)
      );

    } catch (e) {
      console.log("Error connecting: ", e);
      this.resetState();
      throw e;
    }

    return this.device;
  }

  async disconnect() {
    console.log('disconnect');
    if (!this.device) {
      this.resetState();
      throw "no device";
    }

    if (!this.device.gatt.connected) {
      this.resetState();
      throw "not connected";
    }

    try {
      await this.device.gatt.disconnect();
    } catch (e) {
      console.log("Error disconnecting: ", e);
    } finally {
      this.resetState();
    }
  }
}
