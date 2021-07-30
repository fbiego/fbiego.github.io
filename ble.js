

let scanButton = document.querySelector('#scanButton');
let stopButton = document.querySelector('#stopButton');
let scanAlert = document.querySelector('#outputText');



async function scanDevice(){
	try {
		scanAlert.textContent = 'Scanning...';
		let options = {
			acceptAllDevices : true
		};
		

		const device = await navigator.bluetooth.requestDevice(options)
		.then(device => {
			scanAlert.textContent = 'Name: ' + device.name + ' Id: ' + device.id + ' Connected: ' + device.gatt.connected;
		})
		.catch(error => {
			scanAlert.textContent = 'Argh! ' + error;
		});
		const server = await device.gatt.connect();
		const services = await server.getPrimaryServices();
		let sers = '';
		for (const service of services) {
			const characteristics = await service.getCharacteristics();
			characteristics.forEach(characteristic => {
				sers += characteristic.uuid + ' ' + getSupportedProperties(characteristic);
			}
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