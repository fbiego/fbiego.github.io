

let scanButton = document.querySelector('#scanButton');
let deviceList = document.querySelector('#deviceList');
let textAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let serviceList = document.querySelector('#services');
let serviceUUID = document.querySelector('#serviceUUID');
let logs = document.querySelector('#notifyLogs');
let read = false;


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
    let options = {
      acceptAllDevices: true,
      optionalServices: [serviceUUID.value]
    };
    

    const device = await navigator.bluetooth.requestDevice(options);

    
    loadPaired();
    connectDevice(device);
    
  }
  catch(error)  {
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
    }
}

function handleNotifications(event){
  let value = event.target.value;
  logs.innerText += '\n';
  for(let i = 0; i < value.byteLength; i++){
    logs.innerText += ' ' + value.getUint8(i).toString(16);
  }
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
        var li = document.createElement('li');
        li.textContent = ch.uuid + ' ' + getSupportedProperties(ch);
        if (getSupportedProperties(ch).includes('NOTIFY', 0)){
          ch.startNotifications();
          ch.addEventListener('characteristicvaluechanged', handleNotifications);
          //const desc = await ch.getDescriptors();

          
        }
        
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
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    // const main_service = await server.getPrimaryService('fb1e4001-54ae-4a28-9f74-dfccb248601d');
    // const tx_characteristic = await main_service.getCharacteristic('fb1e4002-54ae-4a28-9f74-dfccb248601d')
    // const tx_value = await tx_characteristic.readValue();
    // const str = new TextDecoder().decode(tx_value).split(",");

    loadServices(services);

    const main_service = await server.getPrimaryService('fb1e4001-54ae-4a28-9f74-dfccb248601d');
    const tx_characteristic = await main_service.getCharacteristic('fb1e4002-54ae-4a28-9f74-dfccb248601d');
    const rx_characteristic = await main_service.getCharacteristic('fb1e4003-54ae-4a28-9f74-dfccb248601d');
    // rx_characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
    // //tx_characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
    // //await rx_characteristic.startNotifications();
    // //const nt = await rx_characteristic.getDescriptor('00002902-0000-1000-8000-00805f9b34fb');
    // await nt.readValue().then(value => {
    //         let notificationsBit = value.getUint8(0) & 0b01;
    //         logs.innerText += '\n' + '  > Notifications: ' + (notificationsBit ? 'ON' : 'OFF');
    //         let indicationsBit = value.getUint8(0) & 0b10;
    //         logs.innerText += '\n' + '  > Indications: ' + (indicationsBit ? 'ON' : 'OFF');
    //       });
    const data = new Uint8Array([0xA0]);
    tx_characteristic.writeValue(data);
    textAlert.textContent = '\nComplete';

  }
  catch (error){
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
  }

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


scanButton.addEventListener('click', scanDevice);
