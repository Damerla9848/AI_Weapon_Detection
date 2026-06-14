from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Form
from fastapi.responses import JSONResponse, FileResponse
from app.predictor import predict

from fastapi.middleware.cors import CORSMiddleware
# from app.load_model import get_model
# from app.predictor import predict
import numpy as np
import cv2
import base64

app = FastAPI()
WEAPON_CLASSES = {
    'pistol', 'gun', 'rifle', 'knife', 'weapon',
    'sword', 'grenade', 'explosive', 'firearm', 'handgun',
    'dangerous weapon'  
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def greet():
    return {"message": "Weapon Detection API running"}


@app.post("/upload")
async def upload_img(file: UploadFile = File(...)):

    # Read uploaded image
    image_bytes = await file.read()

    # Convert to numpy array
    np_arr = np.frombuffer(image_bytes, np.uint8)

    # Decode image
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    result,detections = predict(img)

    is_threat = any(
        d.get('class', '').lower() in WEAPON_CLASSES
        for d in detections
    )
    # Create annotated image
    annotated_img = result[0].plot()


    # Encode image to jpg
    _, buffer = cv2.imencode(".jpg", annotated_img)

    # Convert image to base64
    img_base64 = base64.b64encode(buffer).decode("utf-8")

    return JSONResponse(content={
        "detections": detections,
        "image": img_base64,
        "threat": is_threat 
    })

from pydantic import BaseModel
import random, smtplib
from email.mime.text import MIMEText

otp_store = {}

class EmailRequest(BaseModel):
    email: str

class VerifyRequest(BaseModel):
    email: str
    otp: str


@app.post("/send-otp")
def send_otp(data: EmailRequest):
    otp = str(random.randint(100000,999999))
    otp_store[data.email] = otp

    sender = "damerladavidpaul@gmail.com"
    app_password = "cnkojrhvzdntfiew"

    msg = MIMEText(f"Your WeaponScan OTP is: {otp}")
    msg["Subject"] = "WeaponScan Email Verification"
    msg["From"] = sender
    msg["To"] = data.email

    server = smtplib.SMTP("smtp.gmail.com",587)
    server.starttls()
    server.login(sender, app_password)
    server.sendmail(sender, data.email, msg.as_string())
    server.quit()

    return {"message":"OTP sent"}


@app.post("/verify-otp")
def verify_otp(data: VerifyRequest):
    if otp_store.get(data.email) == data.otp:
        return {"verified": True}
    return {"verified": False}


from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText

class AlertRequest(BaseModel):
    email: str
    threat: bool
    detections: list
    image: str



from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import base64


@app.post("/send-alert")
def send_alert(data: AlertRequest):

    sender="damerladavidpaul@gmail.com"
    app_password="cnkojrhvzdntfiew"


    if data.threat:

        body="""
⚠ SECURITY ALERT

Potential threat detected.

See attached detection image.
"""

        subject="⚠ WeaponScan Security Alert"

    else:

        body="""
✅ SCAN REPORT

No dangerous weapon detected.

See attached scan image.
"""

        subject="✅ WeaponScan Safe Report"



    msg = MIMEMultipart()

    msg["Subject"]=subject
    msg["From"]=sender
    msg["To"]=data.email

    msg.attach(
      MIMEText(body)
    )


    # Attach image
    img_bytes = base64.b64decode(
       data.image
    )

    image_part = MIMEImage(
       img_bytes,
       name="detection_result.jpg"
    )

    msg.attach(image_part)



    server=smtplib.SMTP(
      "smtp.gmail.com",
      587
    )

    server.starttls()

    server.login(
      sender,
      app_password
    )

    server.sendmail(
      sender,
      data.email,
      msg.as_string()
    )

    server.quit()

    return {
      "message":"alert sent"
    }

from fastapi import Body

@app.post("/detect-frame")
async def detect_frame(data: dict = Body(...)):
    try:
        # Decode base64 image
        img_data = base64.b64decode(data["image"])
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        result, detections = predict(img)

        is_threat = any(
            d.get('class', '').lower() in WEAPON_CLASSES
            for d in detections
        )

        annotated_img = result[0].plot()

        _, buffer = cv2.imencode(".jpg", annotated_img)
        img_base64 = base64.b64encode(buffer).decode("utf-8")

        return {
            "image": img_base64,
            "threat": is_threat,
            "detections": detections
        }

    except Exception as e:
        return {"error": str(e)}

def cleanup_files(*filepaths):
    import os
    for path in filepaths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error deleting temp file {path}: {e}")

def send_email_alert_sync(email: str, threat: bool, detections: list, image_b64: str):
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.image import MIMEImage
    import base64

    sender = "damerladavidpaul@gmail.com"
    app_password = "cnkojrhvzdntfiew"

    if threat:
        body = "⚠ SECURITY ALERT\n\nPotential threat detected in video scan.\n\nSee attached detection image."
        subject = "⚠ WeaponScan Security Alert"
    else:
        body = "✅ SCAN REPORT\n\nNo dangerous weapon detected in video scan.\n\nSee attached scan image."
        subject = "✅ WeaponScan Safe Report"

    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = email
    msg.attach(MIMEText(body))

    img_bytes = base64.b64decode(image_b64)
    image_part = MIMEImage(img_bytes, name="detection_result.jpg")
    msg.attach(image_part)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender, app_password)
        server.sendmail(sender, email, msg.as_string())
        server.quit()
        print(f"Alert email sent successfully to {email}")
    except Exception as e:
        print(f"Error sending alert email: {e}")

@app.post("/detect-video")
async def detect_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    email: str = Form(None)
):
    import tempfile
    import os
    import smtplib
    try:
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".mp4"
        if not suffix:
            suffix = ".mp4"
            
        fd_in, temp_in_path = tempfile.mkstemp(suffix=suffix)
        os.close(fd_in)
        
        with open(temp_in_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        fd_out, temp_out_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd_out)
        
        cap = cv2.VideoCapture(temp_in_path)
        if not cap.isOpened():
            cleanup_files(temp_in_path, temp_out_path)
            return JSONResponse(status_code=400, content={"error": "Could not open video file"})
            
        width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps    = cap.get(cv2.CAP_PROP_FPS) or 20.0
        
        # Use 'avc1' to encode H.264 video, which runs natively since we loaded openh264 DLL
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(temp_out_path, fourcc, fps, (width, height))
        
        threat_detected = False
        sample_annotated_frame = None
        sample_detections = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            result, detections = predict(frame)
            
            frame_threat = any(
                d.get('class', '').lower() in WEAPON_CLASSES
                for d in detections
            )
            
            annotated_frame = result[0].plot()
            out.write(annotated_frame)
            
            if frame_threat:
                threat_detected = True
                if sample_annotated_frame is None:
                    sample_annotated_frame = annotated_frame.copy()
                    sample_detections = detections
            
        cap.release()
        out.release()
        
        # Add cleanup background task
        background_tasks.add_task(cleanup_files, temp_in_path, temp_out_path)
        
        # Trigger email alert in background if threat was detected and email was provided
        if threat_detected and email and sample_annotated_frame is not None:
            _, img_buffer = cv2.imencode(".jpg", sample_annotated_frame)
            img_base64 = base64.b64encode(img_buffer).decode("utf-8")
            background_tasks.add_task(
                send_email_alert_sync,
                email,
                True,
                sample_detections,
                img_base64
            )
            
        return FileResponse(
            temp_out_path, 
            media_type="video/mp4", 
            filename=f"annotated_{file.filename or 'video.mp4'}"
        )
        
    except Exception as e:
        if 'temp_in_path' in locals() and 'temp_out_path' in locals():
            cleanup_files(temp_in_path, temp_out_path)
        elif 'temp_in_path' in locals():
            cleanup_files(temp_in_path)
        return JSONResponse(status_code=500, content={"error": str(e)})