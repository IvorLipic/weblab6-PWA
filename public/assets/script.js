if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

if ('Notification' in window) {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
      }
    });
  }
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cameraBtn = document.getElementById('cameraBtn');
const newDrawingBtn = document.getElementById('newDrawingBtn');
const takePictureBtn = document.getElementById('takePictureBtn');
const videoElement = document.getElementById('videoElement');
const colorPicker = document.getElementById('colorPicker');
const saveButton = document.getElementById('saveBtn');

let drawing = false;
let stream = null;
let videoActive = false;
let currentColor = '#000000';

// Initialize the canvas with a white background
function initializeCanvas() {
  canvas.width = window.innerWidth * 0.9; 
  canvas.height = window.innerHeight * 0.8; 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

initializeCanvas();

// Color picker listener logic
colorPicker.addEventListener('input', (event) => {
  currentColor = event.target.value;
  ctx.strokeStyle = currentColor; 
  ctx.fillStyle = currentColor;
});

// Clear the canvas for a new drawing
newDrawingBtn.addEventListener('click', () => {
  initializeCanvas();
  canvas.style.display = 'block';
  videoElement.style.display = 'none';
  cameraBtn.style.display = 'block';
  takePictureBtn.style.display = 'none';
});

// Start drawing on the canvas (Desktop)
//==================================================
canvas.addEventListener('mousedown', () => {
  drawing = true;
  ctx.beginPath();
});

document.addEventListener('mouseup', () => (drawing = false));

canvas.addEventListener('mousemove', (event) => {
  if (drawing) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; // Scale to transform mouse coordinates to canvas
    const scaleY = canvas.height / rect.height; 
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.stroke();
  }
});
//==================================================

// Camera button logic to switch from canvas to camera feed
cameraBtn.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.style.display = 'block';
    canvas.style.display = 'none';
    cameraBtn.style.display = 'none';
    newDrawingBtn.style.display = 'none';
    colorPicker.style.display = 'none';
    saveButton.style.display = 'none';
    takePictureBtn.style.display = 'block';
    videoElement.play();
  } catch (err) {
    console.error('Error accessing camera: ', err);
  }
});

// Take picture logic
takePictureBtn.addEventListener('click', () => {
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  stream.getTracks().forEach(track => track.stop()); // Stop video stream
  videoElement.style.display = 'none';
  canvas.style.display = 'block';
  cameraBtn.style.display = 'block';
  takePictureBtn.style.display = 'none';
  newDrawingBtn.style.display = 'block';
  colorPicker.style.display = 'block';
  saveButton.style.display = 'block';
});

// Function to save the image
saveButton.addEventListener('click', () => {
  const imageUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = 'canvas_image.png';
  
  // Check if the user is offline
  if (!navigator.onLine) {
    console.log('User is offline, saving image for background sync');
    setTimeout(() => {
      alert('You are offline. Your image will be saved once you are back online!');
    }, 0); // Defer
    queueSync(); // Queue sync
  } else {
    link.click();
  }
});

// Background sync task (mock)
function queueSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register('save-image').then(() => {
        console.log('Background sync registered for image save');
      }).catch((error) => {
        console.error('Error registering background sync:', error);
      });
    });
  }
}