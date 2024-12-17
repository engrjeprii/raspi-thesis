import threading
import time
import cv2

import logging

# Camera indices
cameras = {}
camera_map = {
    "camera1": 0,
    "camera2": 2,
    "camera3": 4
}


class CameraStream:
    def __init__(self, camera_index, timeout=10):
        self.camera_index = camera_index
        self.timeout = timeout  # Timeout in seconds
        self.capture = None
        self.frame = None
        self.lock = threading.Lock()
        self.running = False
        self.last_access_time = time.time()  # Track the last access time
        self.thread = None

    def start_stream(self):
        if self.capture is None or not self.capture.isOpened():
            self.capture = cv2.VideoCapture(self.camera_index)
            if not self.capture.isOpened():
                raise Exception(f"Camera {self.camera_index} could not be opened")
            self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
            self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
            self.capture.set(cv2.CAP_PROP_FPS, 15)

        self.running = True
        self.last_access_time = time.time()  # Reset access time on start
        self.thread = threading.Thread(target=self.update, daemon=True)
        self.thread.start()

    def update(self):
        while self.running:
            # Stop stream if timeout exceeded
            if time.time() - self.last_access_time > self.timeout:
                print(f"Camera {self.camera_index} timed out")
                self.stop()
                break

            ret, frame = self.capture.read()
            if ret:
                with self.lock:
                    self.frame = frame
            time.sleep(0.1)

    def get_frame(self):
        with self.lock:
            self.last_access_time = time.time()  # Update access time
            return self.frame

    def stop(self):
        self.running = False
        if self.capture:
            self.capture.release()

def generate_frames(camera_stream):
    while camera_stream.running:
        frame = camera_stream.get_frame()
        if frame is None:
            continue

        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 30]
        ret, buffer = cv2.imencode('.jpg', frame, encode_params)
        if not ret:
            continue

        try:
            yield (b"--frame\r\n"
                   b"Content-type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
            time.sleep(0.1)
        except GeneratorExit:
            break

def initializeCameras():
    try:
        print("Initializing cameras")
        for name, index in camera_map.items():
            if name not in cameras:
                print(f"LOOP START. Initializing {name}")
                cameras[name] = CameraStream(index)  # Create a CameraStream instance
                print(f"Initialized camera: {name}")
        return True
    except Exception as e:
        print(f"Error initializing cameras: {e}")
        return False
