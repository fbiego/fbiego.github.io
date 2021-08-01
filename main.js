
let textCheck = document.querySelector('#checkText');
let cardCheck = document.querySelector('#checkCard');


async function checkBLE(){
  try {
    const available = await navigator.bluetooth.getAvailability();

    if (available){
      cardCheck.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-green');
      textCheck.textContent = 'Web BLE is supported';
    } else {
      cardCheck.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
      textCheck.textContent = 'Web BLE is not supported';
    }

    
  }
  catch (error){
    cardCheck.setAttribute('class', 'w3-container w3-margin w3-display-container w3-round w3-border w3-theme-border wl w3-pale-red');
    textCheck.innerText = 'Not supported \n'+error;
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


function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}


function myFunction(id) {
  var x = document.getElementById(id);
  if (x.className.indexOf("w3-show") == -1) {
    x.className += " w3-show";
    x.previousElementSibling.className += " w3-theme-d1";
  } else { 
    x.className = x.className.replace("w3-show", "");
    x.previousElementSibling.className = 
    x.previousElementSibling.className.replace(" w3-theme-d1", "");
  }
}

// Used to toggle the menu on smaller screens when clicking on the menu button
function openNav() {
  var x = document.getElementById("navDemo");
  if (x.className.indexOf("w3-show") == -1) {
    x.className += " w3-show";
  } else { 
    x.className = x.className.replace(" w3-show", "");
  }
}