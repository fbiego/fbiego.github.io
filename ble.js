

let scanButton = document.querySelector('#scanButton');
let stopButton = document.querySelector('#stopButton');
let scanAlert = document.querySelector('#outputText');

let optionalServices = ['fb1e4001-54ae-4a28-9f74-dfccb248601d']



async function scanDevice(){
	try {
		scanAlert.textContent = 'Scanning...';
		let options = {
			acceptAllDevices : true,
			optionalServices: optionalServices
		};
		

		const device = await navigator.bluetooth.requestDevice(options);
		const server = await device.gatt.connect();
		const services = await server.getPrimaryServices();
		let sers = '';
		for (const service of services) {
			const characteristics = await service.getCharacteristics();
			characteristics.forEach(characteristic => {
				sers += characteristic.uuid + ' ' + getSupportedProperties(characteristic);
			});
		}
		scanAlert.textContent = sers;
	}
	catch(error)  {
		scanAlert.textContent = 'Argh! ' + error;
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