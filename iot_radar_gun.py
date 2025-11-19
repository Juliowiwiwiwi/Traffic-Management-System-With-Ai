import requests
import time
import random

# The API endpoint wher its sent
API_ENDPOINT = "http://localhost:5000/iot/report-speeding"

# The secret key to authenticate with the server
API_KEY = "my-secret-iot-key"

# A list of sample license plates to simulate
SAMPLE_PLATES = [
    "RJ10AB1234",  
    "TH25A0465",   
    "KA01XY5678",  
    "DL05PQ9999",  
    "MH20VV1234"   
]

headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}

print(" IoT Radar Gun Simulator ")

while True:
    try:
        plate = random.choice(SAMPLE_PLATES)
        
        speed = random.randint(100, 140) 
        
        #Create the data payload
        payload = {
            "LicensePlate": plate,
            "Speed": speed
        }
        
        print(f"\n[!] Detected speeding: {plate} at {speed} km/h. Sending report...")
        
        #Send the data to Flask server
        response = requests.post(API_ENDPOINT, json=payload, headers=headers)
        
        if response.status_code == 201:
            print(f"[+] Server accepted report. (201)")
        else:
            print(f"[-] Server rejected report. (Code: {response.status_code}, Msg: {response.text})")
            
        #Wait for a random time before detecting the next car
        time.sleep(random.randint(5, 15))

    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Connection refused. Is the Flask server (app.py) running?")
        time.sleep(10)
    except KeyboardInterrupt:
        print("\n--- Simulator stopped ---")
        break