import React, { useEffect, useRef, useState } from 'react';
const App = () => {
  const videoRef = useRef(null);
  const wsRef = useRef(null); // Store WebSocket instance
  const [message, setMessage] = useState(''); // State to hold input message
  const [wsStatus, setWsStatus] = useState('Connecting...'); // WebSocket status

  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Initialize Media Source Extensions
    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, vorbis"');

      const ws = new WebSocket('ws://myraspithesis.ddns.net:8765');
      ws.binaryType = 'arraybuffer'; // Set binary data type for WebSocket
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('Connected');
        console.log('WebSocket connected!');
      };

      ws.onmessage = (event) => {
        console.log('Received data:', event.data);  // Log the incoming data
        if (event.data instanceof ArrayBuffer) {
          const videoChunk = new Uint8Array(event.data);
          console.log('Received video chunk:', videoChunk);

          // Try appending the chunk until the SourceBuffer is not updating
          const appendData = () => {
            if (sourceBuffer && !sourceBuffer.updating && mediaSource.readyState === 'open') {
              console.log('Appending video chunk to SourceBuffer');
              sourceBuffer.appendBuffer(videoChunk);
            } else {
              console.log('SourceBuffer is updating, retrying...');
              setTimeout(appendData, 100);  // Retry after 100ms
            }
          };

          appendData();  // Try appending the data
        } else {
          console.error('Unexpected data format received:', event.data);
        }
      };

      ws.onerror = (error) => {
        setWsStatus('Error');
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        setWsStatus('Closed');
        console.log('WebSocket connection closed.');
      };

      return () => {
        if (mediaSource.readyState === 'open') {
          mediaSource.endOfStream(); // Close the MediaSource when done
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(); // Close WebSocket connection when done
        }
      };
    });

    return () => {
      if (mediaSource.readyState === 'open') {
        mediaSource.endOfStream();
      }
    };
  }, []);

  // Function to send data back to Raspberry Pi
  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message); // Send the message to Raspberry Pi
      console.log('Message sent:', message);
    } else {
      console.log('WebSocket connection is not open.');
    }
  };

  return (
    <div>
      <h1>Raspberry Pi Video Stream</h1>
      <video ref={videoRef} autoPlay controls style={{ width: '100%', height: 'auto' }} />
      <div>
        <p>WebSocket Status: {wsStatus}</p> {/* Display WebSocket connection status */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a command"
        />
        <button onClick={sendMessage}>Send to Raspberry Pi</button>
      </div>
    </div>
  );
};

export default App;
