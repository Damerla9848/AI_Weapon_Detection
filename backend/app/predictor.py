from app.load_model import get_model

model = get_model()

def predict(image):
    result =model(image)

    d=[]
    for r in result:
        if r.boxes is not None:
            for box in r.boxes:

                cls_id = int(box.cls.item())
                conf = float(box.conf.item())

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                d.append({
                    "class": model.names[cls_id],
                    "confidence": conf,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                })

    return result, d
