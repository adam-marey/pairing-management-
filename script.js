// Get the Generate Pairs button element
const generateBtn = document.getElementById('generate-btn');

// Add a click event listener to the Generate Pairs button
generateBtn.addEventListener('click', generatePairs);

const copyBtn = document.getElementById('copy-btn');
copyBtn.addEventListener('click', copyOutput);

// ----------clear btn-------------------------
const clearInputBtn = document.getElementById('clear-input-btn');
clearInputBtn.addEventListener('click', clearInput);

function clearInput() {
  const namesInput = document.getElementById('names-input');
  namesInput.value = '';
  localStorage.clear();
}

// ----------clear btn-------------------------

// ----------Clear Constraints-------------------------
const clearConstraintsBtn = document.getElementById('clear-constraints-btn');
clearConstraintsBtn.addEventListener('click', clearConstraints);

function clearConstraints() {
  const constraintsField = document.getElementById('cannot-pair-input');
  constraintsField.value = '';
}

// --------------------------------------------------

// -------------------------CSV Download-----------------------
const downloadCsvBtn = document.getElementById('download-csv-btn');
downloadCsvBtn.addEventListener('click', downloadCsv);

function downloadCsv() {
  const outputField = document.getElementById('output-field');
  const pairs = outputField.value.split('\n');
  let csvContent = 'data:text/csv;charset=utf-8,Room,';
  let roomNumber = '';

  const roomData = {};

  pairs.forEach(pair => {
    if (pair.startsWith('🚪')) {
      roomNumber = pair.replace('🚪 Room', '').trim();
      roomData[roomNumber] = [];
    } else if (pair.startsWith('👤')) {
      const name = pair.replace('👤', '').trim();
      if (name !== '') {
        roomData[roomNumber].push(name);
      }
    }
  });

  const maxGroupSize = Math.max(
    ...Object.values(roomData).map(group => group.length)
  );

  for (let i = 0; i < maxGroupSize; i++) {
    csvContent += `Name ${i + 1},`;
  }

  csvContent = csvContent.slice(0, -1) + '\n';

  for (const [room, names] of Object.entries(roomData)) {
    csvContent += `${room},`;
    csvContent += names.join(',') + '\n';
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'pairs.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
    toggleConstraintsBtn.textContent = 'Show Pair Constraints';
  }
}

const constraintsField = document.getElementById('cannot-pair-input');
constraintsField.style.display = 'none';

// ----------------------------------------------------------

// -------------------------copyOutput-----------------------

function copyOutput() {
  const outputField = document.getElementById('output-field');
  outputField.select();
  outputField.setSelectionRange(0, 99999);

  document.execCommand('copy');

  alert('Pairs copied to clipboard');
}
// ----------------------------------------------------------

// Load saved data from local storage
loadData();

//---------------------------------
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

// ---------------------------

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
          if (room.length < roomSize && isValidRoom(room, name)) {
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

  rooms.forEach((room, index) => {
    pairsString += `🚪 Room ${index + 1}\n`;
    room.forEach(name => {
      pairsString += `👤 ${name}\n`;
    });
    pairsString += '\n';
  });

  const outputField = document.getElementById('output-field');
  outputField.value = pairsString;

  localStorage.setItem('output', pairsString);

  const numRoomsText = document.getElementById('num-rooms-text');
  numRoomsText.textContent = `${numRooms} rooms needed`;

  const timestamp = new Date().toLocaleString();
  saveData(namesInput, roomSize, cannotPairInput, timestamp);

  updateLastGeneratedText(timestamp);
}

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

// Load saved data from local storage
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

// Save the data to local storage
function saveData(namesInput, roomSize) {
  localStorage.setItem('namesInput', namesInput);
  localStorage.setItem('roomSize', roomSize);

  const cannotPairInput = document.getElementById('cannot-pair-input').value;
  localStorage.setItem('cannotPairInput', cannotPairInput);

  const timestamp = Date.now(); // Use current timestamp
  localStorage.setItem('timestamp', timestamp);
  updateLastGeneratedText(timestamp);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

// Update this part of the code
generateBtn.addEventListener('click', () => {
  generatePairs();
  storeLastGenerated();
});

// Add this line at the end
displayLastGenerated();

// // Generate the pairs string
// rooms.forEach((room, index) => {
//   pairsString += `🚪 Room ${index + 1}\n`;
//   room.forEach(name => {
//     pairsString += `👤 ${name}\n`;
//   });
//   pairsString += '\n';
// });
