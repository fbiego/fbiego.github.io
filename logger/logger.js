

let scanButton = document.querySelector('#scanButton');
let disconnectButton = document.querySelector('#disconnectButton');
let deviceList = document.querySelector('#deviceList');
let textAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let deviceName = document.querySelector('#deviceName');
let logsTable = document.querySelector('#logsTable');
let usageBar = document.querySelector('#usageBar');
let usageText = document.querySelector('#usageText');
let fileList = document.querySelector('#fileList');
let dataLogs = document.querySelector('#dataLogs');
let logName = document.querySelector('#logName');
let read = false;
var state = true;

let service_uuid = 'fb1e4001-54ae-4a28-9f74-dfccb248601d';
let tx_uuid = 'fb1e4002-54ae-4a28-9f74-dfccb248601d';
let rx_uuid = 'fb1e4003-54ae-4a28-9f74-dfccb248601d';

let filters = [{namePrefix: 'ESP'}];

var clockRX, clockTX;

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

function handleNotifications(event){
  let value = event.target.value;
  //const hex = toHexString(value);
  switch (value.getUint8(0)){
    case 0xBA: //
      var time = value.getUint8(1) + "\t" + value.getUint8(2) + ":" + value.getUint8(3);
      var data1 =  (value.getUint8(4) * 100) + value.getUint8(5);
      var data2 = (value.getUint8(6) * 100) + value.getUint8(7);
      dataLogs.innerText += time + "\t" + data1 + "\t" +data2 + "\n";

    break;
    case 0xDA:
    	var used = (value.getUint8(1) * 256 * 256) + (value.getUint8(2) * 256) + value.getUint8(3);
    	var total = (value.getUint8(4) * 256 * 256) + (value.getUint8(5) * 256) + value.getUint8(6);

    	var percent = ((used/total) * 100).toFixed();
    	usageText.innerText = "" + used + "/" + total + " : " + percent + "%";
    	usageBar.style.width = percent + "%";


    break;
    case 0xDB:
    	var len = value.getUint8(5);
    	var dat = [];
    	for (let x = 0; x < len; x++){
    		dat.push(value.getUint8(6+x));
    	}
    	var name = new TextDecoder().decode(new Uint8Array(dat));
    	var size = (value.getUint8(2) * 256 * 256) + (value.getUint8(3) * 256) + value.getUint8(4);
    	var type = value.getUint8(1);
    	var li = document.createElement("li");
    	li.setAttribute("class", "w3-display-container");
    	var div = document.createElement("div");
    	div.setAttribute("class", "w3-display-right");
    	var span = document.createElement("span");
    	span.setAttribute("class", "w3-button w3-round");
    	var down = document.createElement("i");
    	down.setAttribute("class", "fa fa-download");
    	var span2 = document.createElement("span");
    	span2.setAttribute("class", "w3-button w3-round");
    	span.setAttribute("onclick", "deleteLog('ba02"+toHexStr(dat) + "')");
    	span2.setAttribute("onclick", "readLog('ba01"+toHexStr(dat) + "', '" + name + "')");
    	var del = document.createElement("i");
    	del.setAttribute("class", "fa fa-trash");
    	span.appendChild(del);
    	span2.appendChild(down);
    	div.appendChild(span2);
    	div.appendChild(span);
    	li.innerText = name + " (" + size + "bytes)";
    	li.appendChild(div);
    	fileList.appendChild(li);


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
    clockTX = await main.getCharacteristic(tx_uuid);
    clockRX = await main.getCharacteristic(rx_uuid);
    disconnectButton.className = disconnectButton.className.replace(" w3-hide", "");
    scanButton.className += " w3-hide";
    disconnectButton.addEventListener('click',  async (evt) => {
      textAlert.textContent = 'Disconnecting...';
      await device.gatt.disconnect();
    });
    deviceName.textContent = device.name;
    deviceList.className += " w3-hide";
    clockRX.addEventListener('characteristicvaluechanged', handleNotifications);
    await clockRX.startNotifications();

    await sendCode('da');

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

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function saveLogs(){
  // Start file download.
  download(logName.innerText, dataLogs.innerText);
}

scanButton.addEventListener('click', scanDevice);
