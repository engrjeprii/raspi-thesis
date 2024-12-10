import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

import Select from 'react-select';

const CameraStream = () => {
  const cameraOptions = [
    {
      label: 'Camera 1',
      value: 'camera1'
    },
    {

      label: 'Camera 2',
      value: 'camera2'
    },
    {
      label: 'Camera 3',
      value: 'camera3'
    }
  ]
  const [videoUrl, setVideoUrl] = useState('');
  const [keyPressed, setKeyPressed] = useState('');
  const [direction, setDirection] = useState('')

  const [selectedCamera, setSelectedCamera] = useState(cameraOptions[0])

  const socketRef = useRef(null);

  useEffect(() => {
    console.log('Connecting to signaling server...');
    socketRef.current = io('http://myraspithesis.ddns.net:8766');

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
    });


    //   //For keyboard keys
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'a':
        case 'A':
        case 'ArrowLeft':
          socketRef.current.emit('move', 'left');
          setKeyPressed(event.key === 'ArrowLeft' ? 'Left' : event.key)
          setDirection('left')
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          socketRef.current.emit('move', 'right');
          setKeyPressed(event.key === 'ArrowRight' ? 'Right' : event.key)
          setDirection('right')
          break;
        case 'w':
        case 'W':
        case 'ArrowUp':
          socketRef.current.emit('move', 'forward');
          setKeyPressed(event.key === 'ArrowUp' ? 'Up' : event.key)
          setDirection('go')
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          socketRef.current.emit('move', 'backward');
          setKeyPressed(event.key === 'ArrowDown' ? 'Down' : event.key)
          setDirection('stop')
          break;
        default: 
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      socketRef.current.disconnect();
    }
  }, []);


  useEffect(() => {
    setVideoUrl(`http://myraspithesis.ddns.net:8765/video_feed/${selectedCamera.value}`);
  }, [selectedCamera])

  return (
    <div style={{
      padding: 20,
      backgroundColor: '#B0C9D7',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <h2>Camera Stream</h2>
      <div style={{
        width: '250px'
      }}>
        <p style={{
          marginBottom: 5
        }}>
          Select a camera to view
        </p>
        <Select
          onChange={setSelectedCamera}
          value={selectedCamera}
          options={cameraOptions}
        />
      </div>
      <div style={{
        flex: 0.75,
        backgroundColor: 'lightgray',
        marginTop: 5,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img src={videoUrl} alt={`Stream from ${selectedCamera.label}`} style={{
          height: '90%'
        }} />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}>

        <p style={{
          marginTop: 15
        }}>
          Use the arrow keys or WASD keys to move
        </p>

        <div style={styles.container}>

          <div style={{ ...styles.direction, ...styles.south }}>{direction === 'stop' ? keyPressed : ''}</div>
          <div style={{ ...styles.direction, ...styles.east }}>{direction === 'right' ? keyPressed : ''}</div>
          <div style={{ ...styles.direction, ...styles.north }}>{direction === 'go' ? keyPressed : ''}</div>
          <div style={{ ...styles.direction, ...styles.west }}>{direction === 'left' ? keyPressed : ''}</div>
        </div>

      </div>


    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    marginTop: 0,
    width: '250px',
    height: '175px',
    // backgroundColor: 'red'
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
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
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

export default CameraStream;
