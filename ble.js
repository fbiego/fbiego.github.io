

let scanButton = document.querySelector('#scanButton');
let stopButton = document.querySelector('#stopButton');
let scanAlert = document.querySelector('#outputText');
let config = document.querySelector('#config');
let deviceList = document.querySelector('#deviceList');

let optionalServices = ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']



async function scanDevice(){
	try {
		scanAlert.textContent = 'Scanning...';
		let options = {
			acceptAllDevices : true,
			optionalServices: optionalServices
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
			var li = document.createElement("li");
  			li.appendChild(document.createTextNode(dev.name));
  			li.setAttribute('class', 'flx-hover-blue');
  			li.addEventListener('click', function(){
  				li.setAttribute('class', 'flx-pale-blue');
  				connectDevice(dev);
  			}, false);
	  		deviceList.appendChild(li);
		}
		scanAlert.textContent = 'Loaded';
	}
	catch{
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
  				li.setAttribute('class', 'flx-pale-green');
  				navigator.clipboard.writeText(s);
  				window.alert('Copied ' + s + ' to clipboard');
  			}, false);
	  		config.appendChild(li);
  		}

		scanAlert.textContent = 'Value: ' + str[9];
		let sers = '';
		for (const service of services) {
			const characteristics = await service.getCharacteristics();
			characteristics.forEach(characteristic => {
				sers += characteristic.uuid + ' ' + getSupportedProperties(characteristic);
			});
		}
	}
	catch (error){
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