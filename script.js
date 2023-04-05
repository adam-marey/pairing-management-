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
}

// ----------clear btn-------------------------

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
    // Check if the student is already in the room
    if (room.includes(name)) {
      return false;
    }

    // Check if the student is part of a constraint pair
    for (const constraint of cannotPairConstraints) {
      const [name1, name2] = constraint.split(',').map(name => name.trim());
      if (name === name1 && room.includes(name2)) {
        return false;
      }
      if (name === name2 && room.includes(name1)) {
        return false;
      }
    }

    // No constraint violation found
    return true;
  }

  // Shuffle the names array
  namesArray = shuffleArray(namesArray);

  // Assign names to rooms
  for (const name of namesArray) {
    let roomFound = false;
    while (!roomFound) {
      // Shuffle the rooms array
      rooms.sort(() => Math.random() - 0.5);

      for (const room of rooms) {
        if (room.length < roomSize && isValidRoom(room, name)) {
          room.push(name);
          roomFound = true;
          break;
        }
      }
    }
  }

  // Generate the pairs string
  rooms.forEach((room, index) => {
    pairsString += `🚪 Room ${index + 1}\n`;
    room.forEach(name => {
      pairsString += `👤 ${name}\n`;
    });
    pairsString += '\n';
  });

  // Update the output field
  const outputField = document.getElementById('output-field');
  outputField.value = pairsString;

  // Save the output to local storage
  localStorage.setItem('output', pairsString);

  // Update the number of rooms text
  const numRoomsText = document.getElementById('num-rooms-text');
  numRoomsText.textContent = `${numRooms} rooms needed`;

  // Save the input data to local storage
  const timestamp = new Date().toLocaleString();
  saveData(namesInput, roomSize, cannotPairInput, timestamp);

  // Update the last generated text
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
