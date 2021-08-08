

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

var otaRX, otaTX;
var otaData = new Uint8Array();
var fileSize = 0;
var fileParts = 0;

let options = {
  acceptAllDevices : true,
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


async function handleNotifications(event){
  let value = event.target.value;
  //const hex = toHexString(value);
  // logs.innerText += '\n' + event.target.uuid + ': ' ;
  for(let i = 0; i < value.byteLength; i++){
    logs.innerText += ' ' + value.getUint8(i).toString(16);
  }

  switch (value.getUint8(0)){
    case 0xAA: //transfer mode
    //textAlert.textContent += "mode: " + (value.getUint8(1)==1);
      if (value.getUint8(1) == 1){
        for (let x = 0; x < fileParts; x++){
          let pr = Math.trunc((x/fileParts)*100) + '%';
          progressBar.style.width = pr;
          progressBar.innerText = pr;
          await sendPart(x);
        }
      } else {
        await sendPart(0);
      }

    break;
    case 0xF1: //next part
      var next = value.getUint8(1)*256 + value.getUint8(2);
      let pr = Math.trunc((next/fileParts)*100) + '%';
      progressBar.style.width = pr;
      progressBar.innerText = pr;
      await sendPart(next);
    break;
    case 0xF2: //complete, installing firmware
      textAlert.textContent = 'Transfer Complete';
    break;
    case 0x0F: //ota result
    const result = new TextDecoder().decode(value);
      logs.innerText += result;
    break;
  }

}

async function sendPart(pos){
  var start = pos * PART;
  var end = (pos+1) * PART

  if (fileSize < end){
    end = fileSize;
  }
  var parts = (end - start)/MTU;
  for(let i = 0; i < parts; i++){
    var toSend = [0xFB, i];
    for (let y = 0; y < MTU; y++){
      toSend.push(otaData[(pos*PART)+(MTU*i)+y]);
    }
    let send = new Uint8Array(toSend);
    await otaTX.writeValue(send);
    //logs.innerText += '\n[' + toHexString(send)+ ']';
  }
  if ((end-start)%MTU != 0){
    var rem = (end-start)%MTU;
    var toSend = [0xFB, parts];
    for (let y = 0; y < rem; y++){
      toSend.push(otaData[(pos*PART)+(MTU*parts)+y])
    }
    let send = new Uint8Array(toSend);
    await otaTX.writeValue(send);
    //logs.innerText += '\n[' + toHexString(send)+ ']';
  }
  var update = new Uint8Array([0xFC, Math.trunc((end-start)/256), Math.trunc((end-start)%256), Math.trunc(pos/256), Math.trunc(pos%256)]);
  await otaTX.writeValue(update);
  //logs.innerText += '\n[' + toHexString(update)+ ']';
}

async function startOta(){
  //progressBar.setAttribute('style', 'width:90%');
  

  var clear = new Uint8Array([0xFD]);
  await otaTX.writeValue(clear);

  var parts = Math.ceil(fileSize/PART);
  //logs.innerText += parts/256;
  fileParts = parts;
  var data = [0xFF, Math.trunc(parts/256), Math.trunc(parts%256), Math.trunc(MTU/256), Math.trunc(MTU%256)];
  var otaInfo = new Uint8Array(data);

  await otaTX.writeValue(otaInfo);
  uploadButton.className += " w3-hide";

}


function onDisconnected(event) {
  disconnectButton.className += " w3-hide";
  textAlert.textContent = 'Disconnected';
  loadPaired();
}


async function connectDevice(device){

  try {

    otaDevice = device

    device.addEventListener('gattserverdisconnected', onDisconnected);
    const server = await device.gatt.connect();
    //const services = await server.getPrimaryServices();
    const main = await server.getPrimaryService(service_uuid);
    otaTX = await main.getCharacteristic(tx_uuid);
    otaRX = await main.getCharacteristic(rx_uuid);
    otaRX.addEventListener('characteristicvaluechanged', handleNotifications);
    otaRX.startNotifications();
    disconnectButton.className = disconnectButton.className.replace(" w3-hide", "");
    disconnectButton.addEventListener('click',  async (evt) => {
      textAlert.textContent = 'Disconnecting...';
      await device.gatt.disconnect();
    });

    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-green');
    textAlert.textContent = 'Connected';


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