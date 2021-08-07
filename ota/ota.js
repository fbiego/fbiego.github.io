

let scanButton = document.querySelector('#scanButton');
let disconnectButton = document.querySelector('#disconnectButton');
let deviceList = document.querySelector('#deviceList');
let textAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let serviceList = document.querySelector('#services');
let logs = document.querySelector('#notifyLogs');
let fileSelector = document.querySelector('#otaFile');
let uploadButton = document.querySelector('#uploadButton');
let progressBar = document.querySelector('#progressBar');

const service_uuid = 'fb1e4001-54ae-4a28-9f74-dfccb248601d';
const tx_uuid = 'fb1e4002-54ae-4a28-9f74-dfccb248601d';
const rx_uuid = 'fb1e4003-54ae-4a28-9f74-dfccb248601d';

const PART = 16000;
const MTU = 500;

var otaRX = new BluetoothRemoteGATTCharacteristic();
var otaTX = new BluetoothRemoteGATTCharacteristic();
var otaData = new Uint8Array();
var fileSize = 0;

let options = {
  optionalServices: [service_uuid]
};

async function loadPaired(){
  try {
    const devices = await navigator.bluetooth.getDevices();
    removeAllChildNodes(deviceList);
    for (const dev of devices){
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


function handleNotifications(event){
  let value = event.target.value;
  //const hex = toHexString(value);
  logs.innerText += '\n' + event.target.uuid + ': ' ;
  for(let i = 0; i < value.byteLength; i++){
    logs.innerText += ' ' + value.getUint8(i).toString(16);
  }

  switch (value.getUint8(0)){
    case 0xAA: //transfer mode

    break;
    case 0xF1: //next part

    break;
    case 0xF2: //complete, installing firmware

    break;
    case 0x0F: //ota result

    break;
  }

}

async function startOta(){
  //progressBar.setAttribute('style', 'width:90%');

  var parts = Math.ceil(fileSize/PART);
  //logs.innerText += parts/256;
  var otaInfo = Uint8Array.of(0xFF, Math.trunc(parts/256), Math.trunc(parts%256), Math.trunc(MTU/256), Math.trunc(MTU%256));
  logs.innerText += otaInfo;


}


function onDisconnected(event) {
  removeAllChildNodes(serviceList);
  disconnectButton.className += " w3-hide";
  textAlert.textContent = 'Disconnected';
  loadPaired();
}


async function connectDevice(device){

  try {

    otaDevice = device

    device.addEventListener('gattserverdisconnected', onDisconnected);
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    const main = services.getPrimaryService(service_uuid);
    otaTX = await main.getCharacteristic(tx_uuid);
    otaRX = await main.getCharacteristic(rx_uuid);
    disconnectButton.className = disconnectButton.className.replace(" w3-hide", "");
    disconnectButton.addEventListener('click',  async (evt) => {
      textAlert.textContent = 'Disconnecting...';
      await device.gatt.disconnect();
    });



  }
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }

}

function copyLogs(){
  const text = logs.textContent;
  navigator.clipboard.writeText(text);

}

function clearLogs(){
  logs.textContent = "";
}

function readFile(event){
  textAlert.innerText = event.target.files[0].name + "\n" + event.target.files[0].size;
  var reader = new FileReader();
  reader.onload = function(e) {

    otaData = new Uint8Array(e.target.result);
    uploadButton.className = uploadButton.className.replace(" w3-hide", "");
    fileSize = otaData.length;
  };
  reader.onerror = function(e) {
    // error occurred
    textAlert.innerText += 'Error : ' + e.type;
  };
  reader.readAsArrayBuffer(event.target.files[0]);

}

scanButton.addEventListener('click', scanDevice);
fileSelector.addEventListener('change', readFile);
uploadButton.addEventListener('click', startOta);