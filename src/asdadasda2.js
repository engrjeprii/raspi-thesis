import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const VideoStream = () => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);

  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    // Connect to the signaling server (Flask + WebSocket)
    console.log('Connecting to signaling server...');
    socketRef.current = io('http://myraspithesis.ddns.net:8765');

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
    });

    // Handle incoming video stream (WebRTC)
    socketRef.current.on('video-frame', (frame) => {
      console.log('Received video frame', frame);
      try {
        // const videoBlob = new Blob([frame], { type: 'video/mp4' });
        const videoBlob = new Blob([frame], { type: 'image/jpeg' });

        const videoUrl = URL.createObjectURL(videoBlob);

        console.log('Received video URL:', videoUrl);
        videoRef.current.src = videoUrl; // Update video source to play the stream
      } catch (error) {
        console.error('Error processing video frame:', error);
      }
    });

    // WebRTC peer setup
    peerRef.current = new Peer({
      initiator: false, // We’re not the initiator, so we’ll receive the stream
      trickle: false,
    });

    peerRef.current.on('signal', (data) => {
      console.log('Sending WebRTC offer:', data);
      socketRef.current.emit('offer', data); // Send offer to signaling server
    });

    peerRef.current.on('stream', (stream) => {
      console.log('Received WebRTC stream', stream);
      videoRef.current.srcObject = stream; // Display the received stream
    });

    socketRef.current.on('answer', (answer) => {
      console.log('Received WebRTC answer:', answer);
      peerRef.current.signal(answer);
    });

    socketRef.current.on('ice-candidate', (candidate) => {
      console.log('Received ICE candidate:', candidate);
      peerRef.current.signal(candidate);
    });

    // Handle disconnection or error events
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Live Video Stream</h1>
      {/* <img src={imageSrc} alt="Video Stream" style={{ width: '640px', height: '480px' }} /> */}
      
      <video ref={videoRef} autoPlay muted controls style={{ width: '100%', height: 'auto' }} />
    </div>
  );
};

export default VideoStream;
