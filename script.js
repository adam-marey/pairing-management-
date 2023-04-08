// --------------copy pairs-----------------
const copyBtn = document.getElementById('copy-btn');
copyBtn.addEventListener('click', copyOutput);

function copyOutput() {
  const outputField = document.getElementById('output-field');
  const rooms = outputField.getElementsByClassName('pair-container');

  if (rooms.length === 0) {
    alert('Collection is empty!');
    return;
  }

  let outputText = '';
  for (let i = 0; i < rooms.length; i++) {
    const roomTitle = rooms[i].children[0].textContent;
    const pairs = rooms[i].getElementsByClassName('pair');

    outputText += roomTitle + '\n';
    for (let j = 0; j < pairs.length; j++) {
      outputText += pairs[j].textContent + '\n';
    }
    if (i < rooms.length - 1) {
      outputText += '\n';
    }
  }

  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = outputText;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  tempTextArea.setSelectionRange(0, 99999);
  document.execCommand('copy');
  document.body.removeChild(tempTextArea);

  alert('Pairs and rooms copied to clipboard');
}
// ----------------------------------------------------------------------

// ----------clear btn----------------------------------------------------
const clearInputBtn = document.getElementById('clear-input-btn');
clearInputBtn.addEventListener('click', clearInput);

function clearInput() {
  const namesInput = document.getElementById('names-input');
  namesInput.value = '';
  localStorage.clear();
}
// ----------------------------------------------------------------

// ----------Clear Constraints-------------------------
const clearConstraintsBtn = document.getElementById('clear-constraints-btn');
clearConstraintsBtn.addEventListener('click', clearConstraints);

function clearConstraints() {
  const constraintsField = document.getElementById('cannot-pair-input');
  constraintsField.value = '';
}

// ---------------------------------------------------------------

// -------------------------CSV Download-----------------------
const downloadCsvBtn = document.getElementById('download-csv-btn');
downloadCsvBtn.addEventListener('click', downloadCsv);

function downloadCsv() {
  const outputField = document.getElementById('output-field');
  const rooms = outputField.getElementsByClassName('pair-container');
  let csvContent = 'data:text/csv;charset=utf-8,Room,Name\n';

  for (let i = 0; i < rooms.length; i++) {
    const roomTitle = rooms[i].children[0].textContent;
    const pairs = rooms[i].getElementsByClassName('pair');
    const roomNumber = roomTitle.replace('🚪 Room', '').trim();

    for (let j = 0; j < pairs.length; j++) {
      const name = pairs[j].textContent.replace('👤', '').trim();
      csvContent += `Room ${roomNumber},${name}\n`;
    }
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'pairs.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
// --------------------------------------------------------------------------

// -------------------------toggleConstraintsBtn-----------------------

const toggleConstraintsBtn = document.getElementById('toggle-constraints-btn');
toggleConstraintsBtn.addEventListener('click', toggleConstraints);

function toggleConstraints() {
  const constraintsField = document.getElementById('cannot-pair-input');
  if (constraintsField.style.display === 'none') {
    constraintsField.style.display = 'block';
    toggleConstraintsBtn.textContent = 'Hide Pair Constraints';
  } else {
    constraintsField.style.display = 'none';
    toggleConstraintsBtn.textContent = '🔍 Show Pair Constraints';
  }
}

const constraintsField = document.getElementById('cannot-pair-input');
constraintsField.style.display = 'none';

// ----------------------------------------------------------

// Load saved data from local storage
loadData();

// -------------------------Load Data-----------------------

// check if any constraints are violated
function checkConstraints(students, roomSize, pairConstraints) {
  if (students.length === roomSize) {
    for (let constraint of pairConstraints) {
      const [name1, name2] = constraint.split(',').map(name => name.trim());
      if (students.includes(name1) && students.includes(name2)) {
        return true;
      }
    }
  }
  return false;
}

function hasConstraint(name1, name2, constraints) {
  for (const constraint of constraints) {
    const [cname1, cname2] = constraint.split(',').map(name => name.trim());
    if (
      (name1 === cname1 && name2 === cname2) ||
      (name1 === cname2 && name2 === cname1)
    ) {
      return true;
    }
  }
  return false;
}
// -------------------------------------------------------------------------

// -------------------------Generate Pairs-------------------------------

const generateBtn = document.getElementById('generate-btn');
generateBtn.addEventListener('click', generatePairs);

function generatePairs() {
  const namesInput = document.getElementById('names-input').value;
  let namesArray = namesInput.split('\n');
  namesArray = namesArray.filter(name => name.trim() !== '');

  const roomSize = parseInt(document.getElementById('room-size').value);
  const numNames = namesArray.length;
  const numRooms = Math.ceil(numNames / roomSize);

  const cannotPairInput = document.getElementById('cannot-pair-input').value;
  const cannotPairArray = cannotPairInput.split('\n');
  const cannotPairConstraints = cannotPairArray.filter(
    pair => pair.trim() !== ''
  );

  if (numNames === 0) {
    alert('No students entered');
    return;
  }
  if (numNames < roomSize) {
    alert('The total number of students is less than the group size');
    return;
  }
  if (checkConstraints(namesArray, roomSize, cannotPairConstraints)) {
    alert('Restricted pairings identified in the list.');
    return;
  }
  let pairsString = '';

  const rooms = Array.from({ length: numRooms }, () => []);

  function isValidRoom(room, name) {
    if (room.includes(name)) {
      return false;
    }

    for (const constraint of cannotPairConstraints) {
      const [name1, name2] = constraint.split(',').map(name => name.trim());
      if (name === name1 && room.includes(name2)) {
        return false;
      }
      if (name === name2 && room.includes(name1)) {
        return false;
      }
    }

    return true;
  }

  let attempts = 0;
  while (true) {
    attempts += 1;
    if (attempts > 1000) {
      alert(
        'Unable to generate pairs with the current constraints. Please try again or adjust the constraints.'
      );
      return;
    }

    namesArray = shuffleArray(namesArray);

    let allNamesAssigned = true;
    for (const name of namesArray) {
      let roomFound = false;
      let roomSearchAttempts = 0;
      while (!roomFound && roomSearchAttempts < numRooms * 2) {
        rooms.sort(() => Math.random() - 0.5);

        for (const room of rooms) {
          const roomLength = room.length;
          const minLength = Math.floor(numNames / numRooms);
          const maxLength = Math.ceil(numNames / numRooms);

          if (
            (roomLength < maxLength && isValidRoom(room, name)) ||
            (roomLength < minLength &&
              roomLength + 1 < maxLength &&
              isValidRoom(room, name))
          ) {
            room.push(name);
            roomFound = true;
            break;
          }
        }

        roomSearchAttempts += 1;
      }

      if (!roomFound) {
        allNamesAssigned = false;
        break;
      }
    }

    if (
      allNamesAssigned &&
      !checkConstraints(rooms, roomSize, cannotPairConstraints)
    ) {
      break;
    } else {
      // Reset the rooms to start the pairing process again
      rooms.forEach(room => room.splice(0, room.length));
    }
  }

  const outputField = document.getElementById('output-field');
  outputField.innerHTML = '';

  rooms.forEach((room, index) => {
    const roomElement = document.createElement('div');
    roomElement.className = 'pair-container';

    const roomTitle = document.createElement('div');
    roomTitle.textContent = `🚪 Room ${index + 1}`;
    roomElement.appendChild(roomTitle);

    room.forEach(name => {
      const pairElement = document.createElement('div');
      pairElement.className = 'pair';
      pairElement.draggable = 'true';
      pairElement.textContent = `👤 ${name}`;

      roomElement.appendChild(pairElement);
    });

    outputField.appendChild(roomElement);
  });
  localStorage.setItem('output', JSON.stringify(rooms));

  const numRoomsText = document.getElementById('num-rooms-text');
  numRoomsText.textContent = `${numRooms} rooms needed`;

  const timestamp = new Date().toLocaleString();
  saveData(namesInput, roomSize, cannotPairInput, timestamp);

  updateLastGeneratedText(timestamp);
}

// -------------------------------------------------------------------------

// -------------------------updateLastGeneratedText-------------------------------------
function updateLastGeneratedText(timestamp) {
  const lastGeneratedText = document.getElementById('last-generated');

  if (timestamp) {
    const date = new Date(timestamp);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const dateString = date.toLocaleDateString('en-US', options);
    const timeString = date.toLocaleTimeString('en-US');
    lastGeneratedText.textContent = `${dateString} at ${timeString}`;
  } else {
    lastGeneratedText.textContent = 'Not generated yet';
  }
}

// -------------------------------------------------------------------------

// -------------------------LoadData-------------------------------------

function loadData() {
  const namesInput = localStorage.getItem('namesInput');
  if (namesInput) {
    document.getElementById('names-input').value = namesInput;
  }

  const roomSize = localStorage.getItem('roomSize');
  if (roomSize) {
    document.getElementById('room-size').value = roomSize;
  }

  const cannotPairInput = localStorage.getItem('cannotPairInput');
  if (cannotPairInput) {
    document.getElementById('cannot-pair-input').value = cannotPairInput;
  }

  const timestamp = localStorage.getItem('timestamp');
  if (timestamp) {
    updateLastGeneratedText(timestamp);
  }

  const output = localStorage.getItem('output');
  if (output) {
    document.getElementById('output-field').value = output;
  }
}

// -------------------------------------------------------------------------

// -------------------------SaveData-------------------------------------
function saveData(namesInput, roomSize) {
  localStorage.setItem('namesInput', namesInput);
  localStorage.setItem('roomSize', roomSize);

  const cannotPairInput = document.getElementById('cannot-pair-input').value;
  localStorage.setItem('cannotPairInput', cannotPairInput);

  const timestamp = Date.now(); // Use current timestamp
  localStorage.setItem('timestamp', timestamp);
  updateLastGeneratedText(timestamp);
}

// -------------------------------------------------------------------------

// -------------------------shuffleArray-------------------------------------
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// -------------------------------------------------------------------------

// ---------------------------Latest Creation--------------
function displayLastGenerated() {
  const lastGenerated = localStorage.getItem('lastGenerated');
  if (lastGenerated) {
    document.getElementById('last-generated').innerText = lastGenerated;
  } else {
    document.getElementById('last-generated').innerText = 'Not available';
  }
}

function storeLastGenerated() {
  const now = new Date();
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  const dayOfWeek = days[now.getDay()];
  const formattedDate =
    dayOfWeek +
    ', ' +
    now.toLocaleDateString() +
    ' at ' +
    now.toLocaleTimeString();
  localStorage.setItem('lastGenerated', formattedDate);
  displayLastGenerated();
}

// -------------------------------------------------------------------------

// ---------------drob-drag------------------------------------
const outputField = document.getElementById('output-field');

let draggedElement = null;

outputField.addEventListener('dragstart', e => {
  if (e.target.className === 'pair') {
    draggedElement = e.target;
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.target.style.opacity = '0.5';
  }
});

outputField.addEventListener('dragend', e => {
  if (e.target.className === 'pair') {
    e.target.style.opacity = '1';
  }
});

outputField.addEventListener('dragover', e => {
  e.preventDefault();
});

outputField.addEventListener('dragenter', e => {
  if (e.target.className === 'pair' || e.target.className === 'room') {
    e.target.style.border = '2px dashed #333';
  }
});

outputField.addEventListener('dragleave', e => {
  if (e.target.className === 'pair' || e.target.className === 'room') {
    e.target.style.border = '1px solid #ccc';
  }
});

outputField.addEventListener('drop', e => {
  e.preventDefault();
  if (e.target.className === 'pair' || e.target.className === 'room') {
    e.target.style.border = '1px solid #ccc';

    const cannotPairInput = document.getElementById('cannot-pair-input').value;
    const cannotPairArray = cannotPairInput.split('\n');
    const cannotPairConstraints = cannotPairArray.filter(
      pair => pair.trim() !== ''
    );

    const draggedName = draggedElement.textContent
      .trim()
      .replace('👤', '')
      .trim();

    // Get the room divs
    const draggedRoom = draggedElement.parentElement;
    const targetRoom =
      e.target.className === 'room' ? e.target : e.target.parentElement;

    // Temporarily move draggedName to the target room
    targetRoom.appendChild(draggedElement);

    // Check if the new arrangement violates constraints
    const targetRoomNames = Array.from(
      targetRoom.getElementsByClassName('pair')
    ).map(element => element.textContent.trim().replace('👤', '').trim());
    let constraintViolation = false;
    for (const constraint of cannotPairConstraints) {
      const [name1, name2] = constraint.split(',').map(name => name.trim());
      if (targetRoomNames.includes(name1) && targetRoomNames.includes(name2)) {
        constraintViolation = true;
        break;
      }
    }

    // Revert the changes if there's a constraint violation
    if (constraintViolation) {
      alert('Constraints violation: These names cannot be in the same room.');
      targetRoom.removeChild(draggedElement);
      draggedRoom.appendChild(draggedElement);
    }
  }
});

// -------------------------------------------------------------------------

// -------------------------LoadDataFromLocalStorage-------------------------------------

function loadPairsFromLocalStorage() {
  const rooms = JSON.parse(localStorage.getItem('output'));

  if (!rooms) {
    return;
  }

  const outputField = document.getElementById('output-field');
  outputField.innerHTML = '';

  rooms.forEach((room, index) => {
    const roomElement = document.createElement('div');
    roomElement.className = 'pair-container';

    const roomTitle = document.createElement('div');
    roomTitle.textContent = `🚪 Room ${index + 1}`;
    roomElement.appendChild(roomTitle);

    room.forEach(name => {
      const pairElement = document.createElement('div');
      pairElement.className = 'pair';
      pairElement.draggable = 'true';
      pairElement.textContent = `👤 ${name}`;

      roomElement.appendChild(pairElement);
    });

    outputField.appendChild(roomElement);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  loadPairsFromLocalStorage();
});

generateBtn.addEventListener('click', () => {
  generatePairs();
  storeLastGenerated();
});

displayLastGenerated();
