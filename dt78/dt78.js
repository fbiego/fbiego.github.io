

let scanButton = document.querySelector('#scanButton');
let disconnectButton = document.querySelector('#disconnectButton');
let deviceList = document.querySelector('#deviceList');
let textAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let deviceName = document.querySelector('#deviceName');
let logsTable = document.querySelector('#logsTable');
let batteryBar = document.querySelector('#batteryBar');
let usageText = document.querySelector('#usageText');
let fileList = document.querySelector('#fileList');
let dataLogs = document.querySelector('#dataLogs');
let logName = document.querySelector('#logName');
let sendBtn = document.querySelector('#sendBtn');
let textMsg = document.querySelector('#message');
let read = false;
var state = true;

let service_uuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
let tx_uuid = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
let rx_uuid = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

let filters = [{namePrefix: 'Smart'}];

var watchRX, watchTX;

let options = {
  //acceptAllDevices: true,
  optionalServices: [service_uuid],
  filters : filters
};

async function loadPaired(){
  try {
    const devices = await navigator.bluetooth.getDevices();
    deviceName.textContent = "Paired devices";
    removeAllChildNodes(deviceList);
    for (const dev of devices){
      if (dev.name.startsWith("Smart")){
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

function handleNotifications(event){
  let value = event.target.value;
  //const hex = toHexString(value);
  for(let i = 0; i < value.byteLength; i++){
    dataLogs.innerText += ' ' + value.getUint8(i).toString(16);
  }
  dataLogs.innerText += "\n";

  if (value.getUint8(0) == 0xAB){
    switch (value.getUint8(4)){
      case 0x91:
        var bat = value.getUint8(7);
        var state = value.getUint8(6);
        batteryBar.style.width = bat + "%";
        batteryBar.innerText = bat + "%";
      break;
    }
  }
  switch (value.getUint8(0)){
    case 0xBA: //
      var time = value.getUint8(1) + "\t" + value.getUint8(2) + ":" + value.getUint8(3);
      var data1 =  (value.getUint8(4) * 100) + value.getUint8(5);
      var data2 = (value.getUint8(6) * 100) + value.getUint8(7);
      dataLogs.innerText += time + "\t" + data1 + "\t" +data2 + "\n";

    break;  
  }

}

function onDisconnected(event) {
  disconnectButton.className += " w3-hide";
  scanButton.className = scanButton.className.replace(" w3-hide", "");
  textAlert.textContent = 'Disconnected';
  deviceList.className = deviceList.className.replace(" w3-hide", "");
  removeAllChildNodes(fileList);
  loadPaired();
}



async function connectDevice(device){

  try {

    device.addEventListener('gattserverdisconnected', onDisconnected);
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    const main = await server.getPrimaryService(service_uuid);
    watchTX = await main.getCharacteristic(tx_uuid);
    watchRX = await main.getCharacteristic(rx_uuid);
    disconnectButton.className = disconnectButton.className.replace(" w3-hide", "");
    scanButton.className += " w3-hide";
    disconnectButton.addEventListener('click',  async (evt) => {
      textAlert.textContent = 'Disconnecting...';
      await device.gatt.disconnect();
    });
    deviceName.textContent = device.name;
    deviceList.className += " w3-hide";
    watchRX.addEventListener('characteristicvaluechanged', handleNotifications);
    await watchRX.startNotifications();

    await sendCode('da');

  }
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }

}

async function sendNotification(text){
  var message = text;
  var len = message.length;
  if (len > 125){
    message = text.substring(0, 125);
    len = 125;
  }

  if (len <= 12){
    var bytes = [0xAB, 0x00, len+5, 0xFF, 0x72, 0x80, 0x0A, 0x02];
    var msg = new TextEncoder().encode(message);
    await sendCode(toHexStr(bytes)+toHexStr(msg));
  } else {
    var msg0 = new TextEncoder().encode(message.substring(0, 12));
    var bytes = [0xAB, 0x00, len+5, 0xFF, 0x72, 0x80, 0x0A, 0x02];
    await sendCode(toHexStr(bytes)+toHexStr(msg0));

    var rem = len-12;
    var lp = rem/19;
    var rm = rem%19;
    var sub = message.substring(12, len);

    for (let i = 0; i < lp; i++){
      var msg1 = new TextEncoder().encode(sub.substring(i*19, (i*19)+19));
      var by = [i];
      await sendCode(toHexStr(by)+toHexStr(msg1));
    }
    if (rm != 0){
      var msg1 = new TextEncoder().encode(sub.substring(lp*19, sub.length));
      var by = [lp];
      await sendCode(toHexStr(by)+toHexStr(msg1));
    }

  }
}


async function sendCode(code){
  try {
    const data = fromHexString(code);
    await watchTX.writeValue(data);
  } 
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }
}

function readLog(code, name){
	logName.textContent = name + ".txt";
	clearLogs();
	sendCode(code);
}

function deleteLog(code){
	sendCode(code);
}

function clearLogs(){
  dataLogs.textContent = "";
}


function saveLogs(){
  // Start file download.
  //download(logName.innerText, dataLogs.innerText);
  sendNotification(textMsg.value);
}

scanButton.addEventListener('click', scanDevice);
