

let scanButton = document.querySelector('#scanButton');
let disconnectButton = document.querySelector('#disconnectButton');
let deviceList = document.querySelector('#deviceList');
let textAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let serviceList = document.querySelector('#services');
let logs = document.querySelector('#notifyLogs');
let read = false;

let service_uuid = 'fb1e4001-54ae-4a28-9f74-dfccb248601d';
let tx_uuid = 'fb1e4002-54ae-4a28-9f74-dfccb248601d';
let rx_uuid = 'fb1e4003-54ae-4a28-9f74-dfccb248601d';

let filters = [{namePrefix: 'ESP'}];

let options = {
  //acceptAllDevices: true,
  optionalServices: [service_uuid],
  filters : filters
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
  //const hex = Buffer.from(value.buffer).toString('hex');
  logs.innerText += '\n' + event.target.uuid + ': ';
  for(let i = 0; i < value.byteLength; i++){
    logs.innerText += ' ' + value.getUint8(i).toString(16);
  }
}

function onDisconnected(event) {
  removeAllChildNodes(serviceList);
  disconnectButton.className += " w3-hide";
  loadPaired();
  // Object event.target is Bluetooth Device getting disconnected.
  //log('> Bluetooth Device disconnected');
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
          input.addEventListener('change', async (evt) => {
            if (this.checked){
              await characteristic.startNotifications();
            } else {
              await characteristic.stopNotifications();
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
            const read = toHextString(value);
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
            await characteristic.writeValueWithResponse(data);
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
            await characteristic.writeValueWithoutResponse(data);
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
        //srvs += ch.uuid + getSupportedProperties(ch) + "\r\n";
        //var li = document.createElement('li');
        // li.textContent = ch.uuid + ' ' + getSupportedProperties(ch);
        // if (getSupportedProperties(ch).includes('NOTIFY', 0)){
        //   ch.addEventListener('characteristicvaluechanged', handleNotifications);
        //   //const desc = await ch.getDescriptors();
        //   //li.innerText += '<br>Descriptors: ' + desc.map(c => c.uuid).join('\n' + ' '.repeat(19));

          
        // }
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
    loadServices(services);
    disconnectButton.className = disconnectButton.className.replace(" w3-hide", "");

  }
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }

}

scanButton.addEventListener('click', scanDevice);
