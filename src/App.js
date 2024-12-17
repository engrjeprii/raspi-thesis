import React, { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import Select from 'react-select';

const flaskApiUrl = "https://a2d0d096259f.ngrok.app";
const cameraOptions = [
  { label: 'Camera 1', value: 'camera1' },
  { label: 'Camera 2', value: 'camera2' },
  { label: 'Camera 3', value: 'camera3' }
];

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [direction, setDirection] = useState('');
  const [selectedCamera, setSelectedCamera] = useState(cameraOptions[0]);
  const [isConnectedToRaspi, setIsConnectedToRaspi] = useState(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  // Using useRef to keep a persistent reference to the socket instance
  const socketIO = useRef(io(flaskApiUrl, { autoConnect: false })).current;

  useEffect(() => {
    socketIO.on('connected', (response) => {
      console.log('Connected: ', response);
      setIsConnectedToRaspi(response?.isConnected);
      socketIO.emit('initializeCameras');
    });

    socketIO.on('camera_initialized', (response) => {
      console.log('Camera Initialized: ', response);
      setIsCameraInitialized(response?.cameraInitialized);
    });

    socketIO.on('arduino_message', (message) => {
      console.log('Message from arduino: ', message)
    })

    return () => {
      socketIO.off('connected');
      socketIO.off('camera_initialized');
      socketIO.off('arduino_message')
    };
  }, [socketIO]);

  // Function to handle socket connection
  const handleConnection = useCallback(() => {
    if (!isConnectedToRaspi) {
      console.log("Connecting to Raspberry Pi");
      socketIO.connect(); // Connect to the server before emitting events

      // Once connected, emit the "start" event
      socketIO.on('connect', () => {
        socketIO.emit('start');
      });
    } else {
      console.log("Disconnecting");
      socketIO.emit('end');
    }
  }, [isConnectedToRaspi, socketIO]);

  // Handle key press to send movement commands
  const handleKeyDown = useCallback((event) => {
    // Map keys to directions
    const keyToDirection = {
      'a': 'a', 'A': 'a', 'ArrowLeft': 'a',
      'd': 'd', 'D': 'd', 'ArrowRight': 'd',
      'w': 'w', 'W': 'w', 'ArrowUp': 'w',
      's': 's', 'S': 's', 'ArrowDown': 's'
    };

    // Determine the direction from the pressed key
    const direction = keyToDirection[event.key];
    if (direction) {
      console.log(`Key pressed: ${event.key}, Direction: ${direction}`);

      // Emit move event to socket server
      if (socketIO.connected) {
        socketIO.emit('move', direction);
        setDirection(direction);
      } else {
        console.log("Socket is not connected, cannot emit 'move' event");
      }
    }
  }, [socketIO]);

  // Add event listener for keydown
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update video URL once cameras are initialized
  useEffect(() => {
    console.log("Effect triggered");
    console.log("isConnectedToRaspi:", isConnectedToRaspi);
    console.log("isCameraInitialized:", isCameraInitialized);
    console.log("selectedCamera:", selectedCamera);

    if (isConnectedToRaspi && isCameraInitialized) {
      const cameraUrl = `${flaskApiUrl}/video/${selectedCamera.value}?timestamp=${new Date().getTime()}`;
      console.log("Streaming video from ", cameraUrl);
      setVideoUrl(cameraUrl);
    }
  }, [isConnectedToRaspi, isCameraInitialized, selectedCamera]);

  return (
    <div style={styles.container}>
      <h2>Camera Stream</h2>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between'
      }}>

        <div style={styles.cameraSelection}>
          <p>Select a camera to view</p>
          <div style={styles.selectionContainer}>
            <Select
              onChange={setSelectedCamera}
              value={selectedCamera}
              options={cameraOptions}
            />
            <button onClick={handleConnection} style={styles.connectButton}>
              {isConnectedToRaspi ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: 'teal',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}> <p>
            Bin Status</p>
          <p> Full </p> </div>
      </div>

      <div style={styles.videoContainer}>
        <img key={videoUrl} src={videoUrl} alt={`Stream from ${selectedCamera.label}`} style={styles.video} />
      </div>

      <div style={styles.controls}>
        <p>Use the arrow keys or WASD keys to move</p>
        <div style={styles.directionContainer}>
          <div style={{ ...styles.direction, ...styles.north }}>{direction === 'forward' && direction}</div>
          <div style={{ ...styles.direction, ...styles.east }}>{direction === 'right' && direction}</div>
          <div style={{ ...styles.direction, ...styles.south }}>{direction === 'backward' && direction}</div>
          <div style={{ ...styles.direction, ...styles.west }}>{direction === 'left' && direction}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    backgroundColor: '#B0C9D7',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh'
  },
  cameraSelection: {
    width: '250px',
    marginBottom: '20px'
  },
  selectionContainer: {
    display: 'flex',
    gap: '10px',
  },
  connectButton: {
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '5px 10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
  },
  videoContainer: {
    flex: 0.75,
    backgroundColor: 'lightgray',
    marginTop: 5,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  video: {
    height: '90%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: 15,
  },
  directionContainer: {
    position: 'relative',
    width: '250px',
    height: '175px',
  },
  direction: {
    position: 'absolute',
    width: '75px',
    height: '50px',
    backgroundColor: 'lightblue',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  north: {
    top: '5%',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  east: {
    top: '50%',
    right: '5%',
    transform: 'translateY(-50%)',
  },
  south: {
    bottom: '5%',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  west: {
    top: '50%',
    left: '5%',
    transform: 'translateY(-50%)',
  },
};

export default App;
