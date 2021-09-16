

let scanButton = document.querySelector('#scanButton');
let disconnectButton = document.querySelector('#disconnectButton');
let deviceList = document.querySelector('#deviceList');
let textAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let serviceList = document.querySelector('#services');
let logs = document.querySelector('#notifyLogs');
let controlTable = document.querySelector('#controlTable');
let batteryTable = document.querySelector('#batteryTable');
let read = false;

let service_uuid = 'fb1e4001-54ae-4a28-9f74-dfccb248601d';
let tx_uuid = 'fb1e4002-54ae-4a28-9f74-dfccb248601d';
let rx_uuid = 'fb1e4003-54ae-4a28-9f74-dfccb248601d';

let filters = [{namePrefix: 'ESP'}];

var clockRX, clockTX;
var logData;

let options = {
  //acceptAllDevices: true,
  optionalServices: [service_uuid],
  filters : filters
};

const buttons = [];
buttons["ON"] = "1B01DB2410EF";
buttons["OFF"] = "1B01DB24D827";
buttons["B+"] = "1B01DB24C837";
buttons["B-"] = "1B01DB2428D7";
buttons["RED"] = "1B01DB24B847";
buttons["YELLOW"] = "1B01DB24F807";
buttons["LIME"] = "1B01DB2418E7";
buttons["GREEN"] = "1B01DB247887";
buttons["CYAN"] = "1B01DB2458A7";
buttons["COBALT"] = "1B01DB240AF5";
buttons["BLUE"] = "1B01DB2442BD";
buttons["VIOLET"] = "1B01DB2412ED";
buttons["PINK"] = "1B01DB24CA35";
buttons["WHITE"] = "1B01DB2402FD";
buttons["Speed +"] = "1B01DB246897";
buttons["Speed -"] = "1B01DB24A857";
buttons["Static"] = "1B01DB246A95";
buttons["Fade"] = "1B01DB24AA55";
buttons["Disco"] = "1B01DB242AD5";
buttons["Chaser"] = "1B01DB243AC5";
buttons["Scan"] = "1B01DB24B04F";
buttons["M+"] = "1B01DB2448B7";
buttons["B1"] = "1B01DB24E01F";
buttons["B2"] = "1B01DB245AA5";
buttons["B3"] = "1B01DB241AE5";
buttons["B4"] = "1B01DB248A75";
buttons["Power"] = "1B0101FE48B7";
buttons["Mode"] = "1B0101FE58A7";
buttons["Mute"] = "1B0101FE7887";
buttons["Play/Pause"] = "1B0101FE807F";
buttons["Previous"] = "1B0101FE40BF";
buttons["Next"] = "1B0101FEC03F";
buttons["Equalizer"] = "1B0101FE20DF";
buttons["Vol -"] = "1B0101FEA05F";
buttons["Vol +"] = "1B0101FE609F";
buttons["RPT"] = "1B0101FE10EF";
buttons["U/SD"] = "1B0101FE906F";
buttons["K0"] = "1B0101FEE01F";
buttons["K1"] = "1B0101FE50AF";
buttons["K2"] = "1B0101FED827";
buttons["K3"] = "1B0101FEF807";
buttons["K4"] = "1B0101FE30CF";
buttons["K5"] = "1B0101FEB04F";
buttons["K6"] = "1B0101FE708F";
buttons["K7"] = "1B0101FE00FF";
buttons["K8"] = "1B0101FEF00F";
buttons["K9"] = "1B0101FE9867";

async function loadPaired(){
  try {
    const devices = await navigator.bluetooth.getDevices();
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

// function connectClock(){

//     cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-blue');
//     textAlert.textContent = 'Connecting...';
    
//     navigator.bluetooth.requestDevice(options)
//     .then(device => device.gatt.connect())
//     .then(server => server.getPrimaryService(service_uuid))
//     .then(service => service.getCharacteristic(tx_uuid))
//     // .then(characteristic => characteristic.startNotifications())
//     // .then(characteristic => {
//     //   characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
//     //   textAlert.textContent ="Notifications Enabled ";
//     // })
//     .then(characteristic => {
//       // Writing 1 is the signal to reset energy expended.
//       const resetEnergyExpended = Uint8Array.of(0xA0);
//       return characteristic.writeValueWithResponse(resetEnergyExpended);
//     })
//     .then(_ => {
//       cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-blue');
//     textAlert.textContent +="Done ";
//     })
//     .catch(error => { 
//       cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
//       textAlert.textContent += error; 
//     });

// }

function handleNotifications(event){
  let value = event.target.value;
  //const hex = toHexString(value);
  logs.innerText += '\n' + event.target.uuid + ': ' ;
  for(let i = 0; i < value.byteLength; i++){
    logs.innerText += ' ' + value.getUint8(i).toString(16);
  }
  switch (value.getUint8(0)){
    case 0xBA: //
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      var td1 = document.createElement("td");
      var td2 = document.createElement("td");
      var date = value.getUint8(1) + "," + value.getUint8(2) + ":" + value.getUint8(3);
      var bat = (value.getUint8(4) * 100) + value.getUint8(5);
      var ldr = (value.getUint8(6) * 100) + value.getUint8(7);
      td.innerText = date;
      td1.innerText = bat;
      td2.innerText = ldr;
      tr.appendChild(td);
      tr.appendChild(td1);
      tr.appendChild(td2);
      batteryTable.appendChild(tr);
      logData += date + "," + bat + "," + ldr + "\n";
    break;
  }
}

function onDisconnected(event) {
  removeAllChildNodes(serviceList);
  removeAllChildNodes(controlTable);
  disconnectButton.className += " w3-hide";
  textAlert.textContent = 'Disconnected';
  loadPaired();
}


function setProperties(characteristic) {
  var li = document.createElement("li");
  for (const p in characteristic.properties) {
    if (characteristic.properties[p] === true) {
      switch (p.toUpperCase()){
        case 'NOTIFY':
          var div = document.createElement("div");
          div.setAttribute('class', 'w3-bar-item w3-tiny w3-right');
          var input = document.createElement("input");
          input.setAttribute('class', 'w3-check');
          input.setAttribute('type', 'checkbox');
          input.setAttribute('id', characteristic.uuid);
          input.setChecked = true;
          characteristic.startNotifications();
          input.addEventListener('change', function() {
            if (this.checked){
              characteristic.startNotifications();
            } else {
              characteristic.stopNotifications();
            }
          });
          var label = document.createElement("label");
          label.textContent = 'Notify';
          div.appendChild(input);
          div.appendChild(label);
          li.appendChild(div);
        break;
        case 'READ':
          var button = document.createElement("button");
          button.setAttribute('class', 'w3-bar-item w3-btn w3-blue w3-tiny w3-round w3-right w3-margin-left');
          button.textContent = 'Read';
          button.addEventListener('click', async (evt) => {
            const value = await characteristic.readValue();
            const read = toHexString(value);
            logs.innerText += '\n' + characteristic.uuid + ': ' + read;

          });
          li.appendChild(button);

        break;
        case 'WRITE':
          var button = document.createElement("button");
          button.setAttribute('class', 'w3-bar-item w3-btn w3-blue w3-tiny w3-round w3-right w3-margin-left');
          button.textContent = 'Write';
          button.addEventListener('click', async (evt) => {
            var text = document.querySelector('#'+characteristic.uuid).value;
            const data = fromHexString(text);
            //await characteristic.writeValueWithResponse(data);
            await characteristic.writeValue(data);
          });
          li.appendChild(button);

        break;
        case 'WRITEWITHOUTRESPONSE':
          var button = document.createElement("button");
          button.setAttribute('class', 'w3-bar-item w3-btn w3-blue w3-tiny w3-round w3-right w3-margin-left');
          button.textContent = 'Write NR';
          button.addEventListener('click', async (evt) => {
            var text = document.querySelector('#'+characteristic.uuid).value;
            const data = fromHexString(text);
            //await characteristic.writeValueWithoutResponse(data);
            await characteristic.writeValue(data);
          });
          li.appendChild(button);

        break;
      }
    }
  }
  var span = document.createElement("span");
  span.textContent = characteristic.uuid;
  li.appendChild(span);

  if (characteristic.properties.write || characteristic.properties.writeWithoutResponse){
    var input = document.createElement("input");
    input.setAttribute('class', 'w3-input w3-round w3-border');
    input.setAttribute('type', 'text');
    input.setAttribute('id', characteristic.uuid);
    li.appendChild(input);
  }
  characteristic.addEventListener('characteristicvaluechanged', handleNotifications);

  return li;
}


async function loadServices(services){
  try {
    removeAllChildNodes(serviceList);
    for (const service of services){
      const s_uuid = service.uuid;
      var button = document.createElement("button");
      button.setAttribute('class', 'w3-button w3-block w3-blue w3-left-align');
      button.setAttribute('onclick', 'myFunction(\''+s_uuid+'\')');
      button.textContent = s_uuid;

      var demoDiv = document.createElement('div');
      demoDiv.setAttribute('id', s_uuid);
      demoDiv.setAttribute('class', 'w3-hide w3-container');
      var ul = document.createElement('ul');
      ul.setAttribute('class', 'w3-ul');

      serviceList.appendChild(button);
      const characteristics = await service.getCharacteristics();
      for (const ch of characteristics){
        var li = setProperties(ch);
        ul.appendChild(li);
      }
      demoDiv.appendChild(ul);
      serviceList.appendChild(demoDiv);

    }
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-green');
    textAlert.innerText = "";

  }
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }
}

async function connectDevice(device){

  try {

    device.addEventListener('gattserverdisconnected', onDisconnected);
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    const main = await server.getPrimaryService(service_uuid);
    clockTX = await main.getCharacteristic(tx_uuid);
    clockRX = await main.getCharacteristic(rx_uuid);
    loadServices(services);
    disconnectButton.className = disconnectButton.className.replace(" w3-hide", "");
    disconnectButton.addEventListener('click',  async (evt) => {
      textAlert.textContent = 'Disconnecting...';
      await device.gatt.disconnect();
    });
    loadButtons();

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

function loadButtons(){
  removeAllChildNodes(controlTable);
  var l = 0;
  var tr;
  for (let x in buttons){
    if (l % 4 === 0){
      tr = document.createElement("tr");
      //tr.setAttribute('class', 'w3-margin');
    }
    var td = document.createElement("td");
    td.setAttribute('class', 'w3-blue w3-hover-green');
    td.setAttribute('onclick', 'sendCode(\''+ buttons[x]+'\')');
    td.setAttribute('style', 'cursor:pointer');
    td.innerText = x;
    tr.appendChild(td);
    l++;
    if (l % 4 === 0){
      controlTable.appendChild(tr);
    }
  }
  if (l % 4 != 0){
      controlTable.appendChild(tr);
  }

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

function saveData(){
  // Start file download.
  download("data.csv", logData);
}

scanButton.addEventListener('click', scanDevice);
