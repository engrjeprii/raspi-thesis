import React, { useState, useEffect, useCallback } from "react";
import Select from 'react-select';

const flaskApiUrl = "https://immune-crow-vastly.ngrok-free.app";
// const flaskApiUrl = "http://localhost:8765";
const cameraOptions = [
  { label: 'Camera 1', value: 'camera1' },
  { label: 'Camera 2', value: 'camera2' },
  { label: 'Camera 3', value: 'camera3' }
];

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [direction, setDirection] = useState('');
  const [selectedCamera, setSelectedCamera] = useState(cameraOptions[0]);

  const handleKeyDown = useCallback(async (event) => {
    const keyToDirection = {
      'a': 'a', 'A': 'a', 'ArrowLeft': 'a',
      'd': 'd', 'D': 'd', 'ArrowRight': 'd',
      'w': 'w', 'W': 'w', 'ArrowUp': 'w',
      's': 's', 'S': 's', 'ArrowDown': 's'
    };

    const direction = keyToDirection[event.key];
    if (direction) {
      console.log(`Key pressed: ${event.key}, Direction: ${direction}`);
      setDirection(direction);

      try {
        const response = await fetch(`${flaskApiUrl}/move/${direction}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Move ${direction} response:`, data);
      } catch (error) {
        console.error('Error moving:', error);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const cameraUrl = `${flaskApiUrl}/video/${selectedCamera.value}?timestamp=${new Date().getTime()}`;
    console.log("Streaming video from ", cameraUrl);
    setVideoUrl(cameraUrl);
  }, [selectedCamera]);

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
          </div>
        </div>
      </div>

      <div style={styles.videoContainer}>
        {videoUrl ? <img key={videoUrl} src={videoUrl} alt={`Stream from ${selectedCamera.label}`} style={styles.video} /> : 
        <>Select a camera to start streaming</>}
      </div>

      <div style={styles.controls}>
        <p>Use the arrow keys or WASD keys to move</p>
        <div style={styles.directionContainer}>
          <div style={{ ...styles.direction, ...styles.north }} onClick={() => console.log('MOVING FORWARD')}>{direction === 'forward' && direction}</div>
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
