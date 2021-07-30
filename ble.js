

let scanButton = document.querySelector('#scanButton');
let stopButton = document.querySelector('#stopButton');
let scanAlert = document.querySelector('#outputText');
let config = document.querySelector('#config');

let optionalServices = ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']



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
		const main_service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
		const read_val = await main_service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e')
		const val = await read_val.readValue();
		const str = new TextDecoder().decode(val).split(",");

		for (const s of str){
			var li = document.createElement("li");
  			li.appendChild(document.createTextNode(s));
  			li.addEventListener('click', function(){
  				navigator.clipboard.writeText('Copied ' + s + ' to clipboard');
  				window.alert(s);
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
		//scanAlert.textContent = sers;
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