import eventlet

# Allow Eventlet to monkey-patch standard library for async operation
eventlet.monkey_patch()

from flask import Flask, jsonify, request, Response
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from camera import initializeCameras, generate_frames, cameras, camera_map, CameraStream

import threading

import serial
import time

app = Flask(__name__)
CORS(app, resources={r'/*': {'origins': '*'}})
socketio = SocketIO(app, cors_allowed_origins='*')

# Set up the serial connection
arduino = serial.Serial(
    port='/dev/serial0',  # Use /dev/serial0 for Raspberry Pi's UART
    baudrate=9600,
    timeout=1
)
time.sleep(2)  # Wait for the connection to establish

# Function to listen to Arduino messages
def read_from_arduino():
    while True:
        try:
            if arduino.in_waiting > 0:
                message = arduino.readline().decode('utf-8').strip()
                if message:
                    print(f"Received from Arduino: {message}")
                    # Emit to SocketIO clients or process as needed
                    socketio.emit('arduino_message', {'message': message})
        except Exception as e:
            print(f"Error reading from Arduino: {e}")
        time.sleep(0.1)

# Start a background thread to listen to Arduino messages
arduino_thread = threading.Thread(target=read_from_arduino, daemon=True)
arduino_thread.start()

@app.route("/")
def home():
    return jsonify(message="Hello, Flask on Raspberry Pi")

@app.route('/video/<camera_name>')
def video_feed(camera_name):
    print(f"Streaming video from {camera_name}")
    
    if camera_name not in cameras:
        try:
            cameras[camera_name] = CameraStream(camera_map[camera_name])
            cameras[camera_name].start_stream()
        except Exception as e:
            return f"Error initializing camera {camera_name}: {e}", 500
    else:
        camera_stream = cameras[camera_name]
        if not camera_stream.running:
            try:
                camera_stream.start_stream()
            except Exception as e:
                return f"Error starting stream for {camera_name}: {e}", 500

    return Response(
        generate_frames(cameras[camera_name]), 
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@socketio.on("start")
def connect():
    emit("connected", {"isConnected": True})

@socketio.on("initializeCameras")
def camera_initialize():
    try:
        result = initializeCameras()
        print(result)
        emit("camera_initialized", {"cameraInitialized": result})
    except Exception as e:
        print(f"Error during camera initialization: {e}")
        emit("camera_initialized", {"cameraInitialized": False})

@socketio.on("end")
def disconnect():
    try:
        for name, camera in cameras.items():
            if camera.running:
                print(f"Stopping camera {name}")
                camera.stop()
        cameras.clear()  # Clear the camera dictionary to free resources
        print("Closing all SocketIO connections")
        socketio.stop()
        arduino.close()
        emit("ended", {"ended": True})
    except Exception as e:
        print(f"Error during disconnection: {e}")
        emit("ended", {"ended": False})

@socketio.on('move')
def move(direction):
    print("MOVE", direction)
    arduino.write(direction.encode())
    print(f"Sent: {direction}")

if __name__ == "__main__":
    try:
        # Run the app with eventlet (asynchronous)
        socketio.run(app, host="0.0.0.0", port=8765)
    finally:
        # Ensure cameras are stopped and resources are cleaned up when the app is terminated
        for name, camera in cameras.items():
            if camera.running:
                print(f"Stopping camera {name}")
                camera.stop()
        cameras.clear()  # Clear the camera dictionary to free resources
        print("Closing all SocketIO connections")
        socketio.stop()
        arduino.close()
        

