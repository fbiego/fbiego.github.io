

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

let options = {
  acceptAllDevices: true,
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
}

function onDisconnected(event) {
  removeAllChildNodes(serviceList);
  disconnectButton.className += " w3-hide";
  textAlert.textContent = 'Disconnected';
  loadPaired();
  // Object event.target is Bluetooth Device getting disconnected.
  //log('> Bluetooth Device disconnected');
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
        //var li = setProperties(ch);
        
        //ul.appendChild(li);
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

scanButton.addEventListener('click', scanDevice);
