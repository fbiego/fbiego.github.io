

let scanButton = document.querySelector('#scanButton');
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

    
    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    loadServices(services);
    const main_service = await server.getPrimaryService('fb1e4001-54ae-4a28-9f74-dfccb248601d');
    const tx_characteristic = await main_service.getCharacteristic('fb1e4002-54ae-4a28-9f74-dfccb248601d');
    const rx_characteristic = await main_service.getCharacteristic('fb1e4003-54ae-4a28-9f74-dfccb248601d');
    rx_characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
    await rx_characteristic.startNotifications();
    const data = Uint8Array.of(0xA0);
    await tx_characteristic.writeValueWithResponse(data);


  }
  catch(error)  {
    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textAlert.textContent = error;
    }
}

function connectClock(){

    cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-blue');
    textAlert.textContent = 'Connecting...';
    
    navigator.bluetooth.requestDevice(options)
    .then(device => device.gatt.connect())
    .then(server => server.getPrimaryService(service_uuid))
    .then(service => service.getCharacteristic(tx_uuid))
    // .then(characteristic => characteristic.startNotifications())
    // .then(characteristic => {
    //   characteristic.addEventListener('characteristicvaluechanged', handleNotifications);
    //   textAlert.textContent ="Notifications Enabled ";
    // })
    .then(characteristic => {
      // Writing 1 is the signal to reset energy expended.
      const resetEnergyExpended = Uint8Array.of(0xA0);
      return characteristic.writeValueWithResponse(resetEnergyExpended);
    })
    .then(_ => {
      cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-blue');
    textAlert.textContent +="Done ";
    })
    .catch(error => { 
      cardAlert.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
      textAlert.textContent += error; 
    });

}

function handleNotifications(event){
  let value = event.target.value;
  logs.innerText += '\n' + value.buffer;
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
          //ch.addEventListener('characteristicvaluechanged', handleNotifications);
          const desc = await ch.getDescriptors();
          li.innerText += '<br>Descriptors: ' + desc.map(c => c.uuid).join('\n' + ' '.repeat(19));

          
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

scanButton.addEventListener('click', scanDevice);
