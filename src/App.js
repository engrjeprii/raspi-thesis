import React, { useState, useEffect, useRef } from 'react';

import io from 'socket.io-client';

const App = () => {
  const videoUrl = 'http://myraspithesis.ddns.net:8765/video_feed';


  const socketRef = useRef(null);
  const peerRef = useRef(null);

  const [keyPressed, setKeyPressed] = useState(null);


  useEffect(() => {

    console.log('Connecting to signaling server...');
    socketRef.current = io('http://myraspithesis.ddns.net:8765');

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
    });

    socketRef.current.on('response', (data) => {
      console.log('Response from Raspberry Pi:', data);
    });


    //For keyboard keys
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'a':
        case 'A':
        case 'ArrowLeft':
          socketRef.current.emit('message', 'left');
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          socketRef.current.emit('message', 'right');
          break;
        case 'w':
        case 'W':
        case 'ArrowUp':
          socketRef.current.emit('message', 'forward');
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          socketRef.current.emit('message', 'backward');
          break;
      }
      setKeyPressed(event.key);  // Sets the key pressed
    };

    window.addEventListener('keydown', handleKeyDown);


    return () => {
      // Cleanup if needed
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div>
      <h1>Thesis monitoring app stream</h1>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50%',
        perspective: '1000px',
      }}>
        {/* <img src={videoUrl} id="App" alt="Live Stream" style={{
          transform: 'rotateY(25deg)',
          marginRight: '-50px',
        }} />
        <img src={videoUrl} id="App" alt="Live Stream" style={{
          transform: 'rotateY(0deg) scale(1.1)',
          zIndex: 1,
        }} />
        <img src={videoUrl} id="App" alt="Live Stream" style={{
          transform: 'rotateY(-25deg)',
          marginLeft: '-50px',
        }} /> */}
      </div>

    </div>
  );
};

export default App;
