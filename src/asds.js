import React, { useEffect, useRef, useState } from 'react';

const App = () => {
  const videoRef = useRef(null);
  const wsRef = useRef(null); // Store WebSocket instance
  const [message, setMessage] = useState(''); // State to hold input message
  const [wsStatus, setWsStatus] = useState('Connecting...'); // WebSocket status

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Initialize Media Source Extensions
    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    let sourceBuffer = null;

    mediaSource.addEventListener('sourceopen', () => {
      // Create SourceBuffer to receive video data
      sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, vorbis"');
      console.log('MediaSource opened');

      const ws = new WebSocket('ws://myraspithesis.ddns.net:8765');
      ws.binaryType = 'arraybuffer'; // Set binary data type for WebSocket
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('Connected');
        console.log('WebSocket connected!');
      };

      ws.onmessage = (event) => {
        console.log('Received data:', event.data);
        if (event.data instanceof ArrayBuffer) {
          const videoChunk = new Uint8Array(event.data);
          console.log('Received video chunk:', videoChunk);

          // Function to append data after SourceBuffer is ready
          const appendData = () => {
            if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
              console.log('Appending video chunk to SourceBuffer');
              sourceBuffer.appendBuffer(videoChunk);
            } else {
              console.log('SourceBuffer is updating, retrying...');
              setTimeout(appendData, 100);  // Retry after 100ms
            }
          };

          // Start appending the data
          appendData();
        } else {
          console.error('Unexpected data format received:', event.data);
        }
      };

      // Listen for updateend event to retry appending new data
      sourceBuffer.onupdateend = () => {
        console.log('SourceBuffer update completed, ready for new data');
        // When SourceBuffer finishes, check for new data to append
        // No need to call appendData explicitly here since the retry logic handles it
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
        // Cleanup: We don't want to call endOfStream() because the stream is ongoing
        if (mediaSource.readyState === 'open') {
          console.log('MediaSource is still open');
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(); // Close WebSocket connection when done
        }
      };
    });

    return () => {
      // Clean up when component unmounts
      if (mediaSource.readyState === 'open') {
        console.log('MediaSource is still open');
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
        <p>WebSocket Status: {wsStatus}</p>
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
