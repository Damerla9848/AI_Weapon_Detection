import urllib.request
import bz2
import os
import shutil

url = "http://ciscobinary.openh264.org/openh264-1.8.0-win64.dll.bz2"
output_bz2 = "openh264.bz2"
output_dll = "openh264-1.8.0-win64.dll"

print("Downloading OpenH264 library...")
try:
    # Set headers to avoid 403 Forbidden if any
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        with open(output_bz2, 'wb') as out_file:
            out_file.write(response.read())
            
    print("Downloaded successfully. Decompressing...")
    
    with bz2.open(output_bz2, "rb") as f_in:
        with open(output_dll, "wb") as f_out:
            f_out.write(f_in.read())
            
    print(f"Successfully decompressed: {output_dll}")
    
    # Copy to app folder too for safety
    os.makedirs("app", exist_ok=True)
    shutil.copy(output_dll, os.path.join("app", output_dll))
    print("Copied DLL to app folder.")
    
    # Clean up bz2
    if os.path.exists(output_bz2):
        os.remove(output_bz2)
    print("Cleanup completed.")
        
except Exception as e:
    print("Error during setup:", e)
