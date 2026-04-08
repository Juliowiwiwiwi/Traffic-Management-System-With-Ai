import torch

# Workaround for PyTorch 2.6 weights_only=True restricted loading
_original_load = torch.load
def _safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = _safe_load

import cv2
import math
import cvzone
from ultralytics import YOLO

# Initialize video capture
video_path = "Media/bike_1.mp4"
cap = cv2.VideoCapture(video_path)

# Load YOLO model with custom weights
model = YOLO("Weights/best.pt")

# Define class names
classNames = ['With Helmet', 'Without Helmet']

# For the use of Webcam
# Open the webcam (use 0 for the default camera, or 1, 2, etc. for additional cameras)
# cap = cv2.VideoCapture(0)

while True:
    success, img = cap.read()
    if not success:
        break # Break the loop if the video has ended

    # --- THIS IS THE CRITICAL CHANGE ---
    # Change from model() to model.track()
    # 'persist=True' tells the tracker to remember IDs between frames
    results = model.track(img, persist=True, conf=0.30, iou=0.5, imgsz=640, tracker="botsort.yaml")
    # --- END OF CHANGE ---

    for r in results:
        boxes = r.boxes
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0]
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

            w, h = x2 - x1, y2 - y1
            cvzone.cornerRect(img, (x1, y1, w, h))

            conf = math.ceil((box.conf[0] * 100)) / 100
            cls = int(box.cls[0])

            # --- NEW PART: GET TRACKER ID ---
            # Default to 0 if no ID is found
            track_id = 0
            if box.id is not None:
                track_id = int(box.id[0])
            # --- END OF NEW PART ---

            # Display text, now with the ID
            cvzone.putTextRect(img, f'ID: {track_id} {classNames[cls]} {conf}', (max(0, x1), max(35, y1)), scale=1, thickness=1)

    cv2.imshow("Image", img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()