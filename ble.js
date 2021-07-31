

let scanButton = document.querySelector('#scanButton');
let stopButton = document.querySelector('#stopButton');
let scanAlert = document.querySelector('#outputText');
let config = document.querySelector('#config');
let deviceList = document.querySelector('#deviceList');

let optionalServices = ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'];

let filters = [{namePrefix: 'Cwash'}];



async function scanDevice(){
	try {
		scanAlert.textContent = 'Scanning...';
		let options = {
			optionalServices: optionalServices,
			filters : filters
		};
		

		const device = await navigator.bluetooth.requestDevice(options);

		connectDevice(device);
		
	}
	catch(error)  {
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
  					scanAlert.setAttribute('class', 'flx-pale-blue');
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
		scanAlert.setAttribute('class', 'flx-pale-red');
		scanAlert.textContent = 'Argh! ' + error;
	}
}

async function connectDevice(device){

	try {
		const server = await device.gatt.connect();
		const services = await server.getPrimaryServices();
		const main_service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
		const read_val = await main_service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e')
		const val = await read_val.readValue();
		const str = new TextDecoder().decode(val).split(",");


		removeAllChildNodes(config);
		for (const s of str){
			var li = document.createElement("li");
  			li.appendChild(document.createTextNode(s));
  			li.setAttribute('class', 'flx-hover-green');
  			li.addEventListener('click', function(){
  				this.setAttribute('class', 'flx-pale-green');
  				navigator.clipboard.writeText(s);
  				window.alert('Copied ' + s + ' to clipboard');
  			}, false);
	  		config.appendChild(li);
  		}

		scanAlert.setAttribute('class', 'flx-pale-green');
		scanAlert.textContent = '' + str[9];
		scanAlert.addEventListener('click', function(){
  			navigator.clipboard.writeText(str[9]);
  			window.alert('Copied ' + str[9] + ' to clipboard');
  		}, false);

		let sers = '';
		for (const service of services) {
			const characteristics = await service.getCharacteristics();
			characteristics.forEach(characteristic => {
				sers += characteristic.uuid + ' ' + getSupportedProperties(characteristic);
			});
		}
	}
	catch (error){
		scanAlert.setAttribute('class', 'flx-pale-red');
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