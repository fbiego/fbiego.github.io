

let scanButton = document.querySelector('#scanButton');
let stopButton = document.querySelector('#stopButton');
let scanAlert = document.querySelector('#outputText');



async function scanDevice(){

	try {
		scanAlert.textContent = 'Scanning...';
		let options = {};
		options.acceptAllDevices = true;

		const scan = await navigator.bluetooth.requestDevice(options)
		.then(device => {
			scanAlert.textContent ='> Name:             ' + device.name + '\n> Id:               ' + device.id +'\n> Connected:        ' + device.gatt.connected;
		})
		.catch(error => {
			scanAlert.textContent = 'Argh! ' + error;
		});
	}
	catch(error)  {
		scanAlert.textContent = 'Argh! ' + error;
  	}


}

scanButton.addEventListener('click', scanDevice);