

let scanButton = document.querySelector('#scanButton');
let stopButton = document.querySelector('#stopButton');
let scanAlert = document.querySelector('#outputText');
let cardAlert = document.querySelector('#outputCard');
let configList = document.querySelector('#configList');
let deviceList = document.querySelector('#deviceList');
let deviceSerial = document.querySelector('#deviceSerial');
let copyButton = document.querySelector('#copySerial');


let service_uuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
let tx_uuid = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

let optionalServices = [service_uuid];
let filters = [{namePrefix: 'Cwash'}];



async function scanDevice(){
	try {
		cardAlert.setAttribute('class', 'flx-container flx-card-4 flx-margin flx-pale-blue');
		scanAlert.textContent = 'Scanning...';
		let options = {
			optionalServices: optionalServices,
			filters : filters
		};
		

		const device = await navigator.bluetooth.requestDevice(options);

		connectDevice(device);
		
	}
	catch(error)  {
		cardAlert.setAttribute('class', 'flx-container flx-card-4 flx-margin flx-pale-red');
		scanAlert.textContent = 'Argh! ' + error;
  	}
}

async function loadPaired(){
	try {
		const devices = await navigator.bluetooth.getDevices();
		removeAllChildNodes(deviceList);
		for (const dev of devices){
			if (dev.name.startsWith("Cwash")){
				var li = document.createElement("li");
  				li.appendChild(document.createTextNode(dev.name));
  				li.setAttribute('class', 'flx-hover-blue');
  				li.addEventListener('click', async function(){
  					this.setAttribute('class', 'flx-pale-blue');
  					cardAlert.setAttribute('class', 'flx-container flx-card-4 flx-margin flx-pale-blue');
					scanAlert.textContent = 'Connecting to ' + dev.name;
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
	catch{
		cardAlert.setAttribute('class', 'flx-container flx-card-4 flx-margin flx-pale-red');
		scanAlert.textContent = 'Argh! ' + error;
	}
}

async function connectDevice(device){

	try {
		const server = await device.gatt.connect();
		//const services = await server.getPrimaryServices();
		const main_service = await server.getPrimaryService(service_uuid);
		const tx_characteristic = await main_service.getCharacteristic(tx_uuid)
		const tx_value = await tx_characteristic.readValue();
		const str = new TextDecoder().decode(tx_value).split(",");


		removeAllChildNodes(configList);
		for (const s of str){
			var li = document.createElement("li");
  			li.appendChild(document.createTextNode(s));
  			li.setAttribute('class', 'flx-hover-green');
  			// li.addEventListener('click', function(){
  			// 	this.setAttribute('class', 'flx-pale-green');
  			// 	navigator.clipboard.writeText(s);
  			// 	window.alert('Copied ' + s + ' to clipboard');
  			// }, false);
	  		configList.appendChild(li);
  		}

		//deviceSerial.setAttribute('class', 'flx-pale-green');
		deviceSerial.textContent = '' + str[9];
		copySerial.removeAttribute('style');
		copySerial.addEventListener('click', function(){
  			navigator.clipboard.writeText(str[9]);
  			copySerial.textContent = 'Serial copied!';
  			//window.alert('Copied ' + str[9] + ' to clipboard');
  			setTimeout(function(){
  				copySerial.textContent = 'Copy Serial';
  			}, 3000);
  		}, false);
  		cardAlert.setAttribute('class', 'flx-container flx-card-4 flx-margin flx-pale-green');
		scanAlert.textContent = 'Data read success';

	}
	catch (error){
		cardAlert.setAttribute('class', 'flx-container flx-card-4 flx-margin flx-pale-red');
		scanAlert.textContent = 'Argh! ' + error;
	}

}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}


function getSupportedProperties(characteristic) {
  let supportedProperties = [];
  for (const p in characteristic.properties) {
    if (characteristic.properties[p] === true) {
      supportedProperties.push(p.toUpperCase());
    }
  }
  return '[' + supportedProperties.join(', ') + ']';
}

scanButton.addEventListener('click', scanDevice);
stopButton.addEventListener('click', loadPaired);