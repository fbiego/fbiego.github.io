

let scanButton = document.querySelector('#scanButton');
let disconnectButton = document.querySelector('#disconnectButton');
let deviceList = document.querySelector('#deviceList');
let textAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let deviceName = document.querySelector('#deviceName');
let openButton = document.querySelector('#openButton');
let closeButton = document.querySelector('#closeButton');
let read = false;
var state = true;

let service_uuid = 'fb1e4001-54ae-4a28-9f74-dfccb248601d';
let tx_uuid = 'fb1e4002-54ae-4a28-9f74-dfccb248601d';
let rx_uuid = 'fb1e4003-54ae-4a28-9f74-dfccb248601d';

let filters = [{namePrefix: 'PBOX'}];

var clockRX, clockTX;

let options = {
  //acceptAllDevices: true,
  optionalServices: [service_uuid],
  filters : filters
};

async function loadPaired(){
  try {
    const devices = await navigator.bluetooth.getDevices();
    deviceName.textContent = "Devices";
    removeAllChildNodes(deviceList);
    for (const dev of devices){
      if (dev.name.startsWith("ESP")){
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(dev.name));
        li.setAttribute('class', 'w3-hover-blue');
        li.addEventListener('click', async function(){
          this.setAttribute('class', 'w3-pale-blue');
          cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-blue');
          textAlert.textContent = 'Connecting to ' + dev.name;
          let abortController = new AbortController();
          await dev.watchAdvertisements({signal: abortController.signal});
          dev.addEventListener('advertisementreceived', async (evt) => {
            abortController.abort();
            connectDevice(dev);
          });
        }, false);
        deviceList.appendChild(li);
      }

    }
  }
  catch (error) {
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }
}

async function scanDevice(){
  try {
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-blue');
    textAlert.textContent = 'Scanning...';
    
    

    const device = await navigator.bluetooth.requestDevice(options);
    
    connectDevice(device);


  }
  catch(error)  {
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
    }
}

// function handleNotifications(event){
  // let value = event.target.value;
  // //const hex = toHexString(value);
  // logs.innerText += '\n' + event.target.uuid + ': ' ;
  // for(let i = 0; i < value.byteLength; i++){
    // logs.innerText += ' ' + value.getUint8(i).toString(16);
  // }
// }

function onDisconnected(event) {
  disconnectButton.className += " w3-hide";
  controls.className += " w3-hide";
  scanButton.className = scanButton.className.replace(" w3-hide", "");
  textAlert.textContent = 'Disconnected';
  deviceList.className = deviceList.className.replace(" w3-hide", "");
  loadPaired();
}


async function connectDevice(device){

  try {

    device.addEventListener('gattserverdisconnected', onDisconnected);
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    const main = await server.getPrimaryService(service_uuid);
    clockTX = await main.getCharacteristic(tx_uuid);
    clockRX = await main.getCharacteristic(rx_uuid);
    disconnectButton.className = disconnectButton.className.replace(" w3-hide", "");
    controls.className = controls.className.replace(" w3-hide", "");
    scanButton.className += " w3-hide";
    disconnectButton.addEventListener('click',  async (evt) => {
      textAlert.textContent = 'Disconnecting...';
      await device.gatt.disconnect();
    });
    deviceName.textContent = device.name;
    deviceList.className += " w3-hide";

  }
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }

}




async function sendCode(code){
  try {
    const data = fromHexString(code);
    await clockTX.writeValue(data);
  } 
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }
}


scanButton.addEventListener('click', scanDevice);
