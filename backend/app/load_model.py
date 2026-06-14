from ultralytics import YOLO
# from backend.models import optimal

model=YOLO('models/optimal.pt')

def get_model():
    return model