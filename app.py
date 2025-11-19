from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
import uuid
import os
import cv2
import numpy as np
import math
from ultralytics import YOLO
import easyocr
import io
from flask import send_from_directory

# initialize flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'secretig'  
jwt = JWTManager(app)
bcrypt = Bcrypt(app)


print("Loading ML models and EasyOCR...")
try:
    helmet_model = YOLO("Weights/best.pt")
    helmet_classNames = ['With Helmet', 'Without Helmet']
    plate_model = YOLO("Weights/license_plate_detector.pt") 
    reader = easyocr.Reader(['en'])
    print("Models and EasyOCR loaded successfully.")
except Exception as e:
    print(f"ERROR: Could not load models or EasyOCR. {e}")


CORS(app, resources={
    r"/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
}) 

# function to create a new database connection
def get_db_connection():
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            passwd="root",
            database="TrafficDB"
        )
        return db
    except mysql.connector.Error as e:
        print("Error connecting to MySQL:", e)
        return None


# testing database connection
@app.route('/test-db', methods=['GET'])
def test_db():
   # will return json response with the database name
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Failed to connect to the database"}), 500

        cursor = db.cursor()
        cursor.execute("SELECT DATABASE();")
        db_name = cursor.fetchone()[0]
        cursor.close()
        db.close()
        return jsonify({"message": f"Connected to database: {db_name}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#authentication routes
@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
        
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()
        cursor.execute("SELECT password, role FROM loginuser WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        db.close()

        if user:
            user_password=user[0]
            user_role=user[1]

        if bcrypt.check_password_hash(user_password, password):
            token = create_access_token(identity=username, additional_claims={"role": user_role})
            return jsonify({
                "success": True,
                "token": token,
                "username": username,
                "role": user_role
            }), 200
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
            
    except Exception as e:
        print(f"Database error: {str(e)}")
        return jsonify({"success": False, "message": "Server error"}), 500

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    try:
        # pssword hashing
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()
        
        # check user exits or not already
        cursor.execute("SELECT username FROM loginuser WHERE username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            db.close()
            return jsonify({"message": "Username already exists"}), 400

        # insert new user
        cursor.execute(
            "INSERT INTO loginuser (username, password) VALUES (%s, %s)",
            (username, hashed_password)
        )
        db.commit()
        cursor.close()
        db.close()
        
        return jsonify({"message": "User registered successfully"}), 201
        
    except mysql.connector.Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

def _build_cors_preflight_response():
    response = jsonify({"message": "Preflight request received"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "POST")
    return response






#model stuff
def detect_violation_and_plate(img):

    violation_found = False
    violation_type_found = ""
    plate_text_clean = None
    annotated_img = img.copy()
    
    # Run HelmetDetection
    helmet_results = helmet_model(img)

    for r in helmet_results:
        boxes = r.boxes
        for box in boxes:
            cls = int(box.cls[0])
            class_name = helmet_classNames[cls]

            if class_name == 'Without Helmet':
                violation_found = True
                violation_type_found = class_name
                #Draw the -Without Helmet box
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 0, 255), 2) # Red box
                cv2.putText(annotated_img, f'{class_name}', (x1, y1 - 10),cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                break
        if violation_found:
            break
    
    # If a violation was found, find the license plate
    if violation_found:
        print("Violation detected! Searching for license plate...")
        
        plate_results = plate_model(img, conf=0.1) 
        
        for r_plate in plate_results:
            boxes_plate = r_plate.boxes
            if len(boxes_plate) > 0:
                best_plate_box = boxes_plate[0] 
                px1, py1, px2, py2 = map(int, best_plate_box.xyxy[0])
                
                # Crop the image
                padding = 5
                py1, py2 = max(0, py1 - padding), min(img.shape[0], py2 + padding)
                px1, px2 = max(0, px1 - padding), min(img.shape[1], px2 + padding)
                
                plate_crop = img[py1:py2, px1:px2]

                try:
                    # Run OCR
                    ocr_result = reader.readtext(plate_crop)
                    if ocr_result:
                        plate_text = ocr_result[0][1]
                        plate_text_clean = "".join(filter(str.isalnum, plate_text)).upper()
                        print(f"Plate found: {plate_text_clean}")
                        #Draw "License Plate" box 
                        cv2.rectangle(annotated_img, (px1, py1), (px2, py2), (0, 255, 0), 2) # Green box
                        cv2.putText(annotated_img, f'{plate_text_clean}', (px1, py1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                        break 
                except Exception as e:
                    print(f"Error during OCR: {e}")
            
        if not plate_text_clean:
            print("Violation found, but no license plate was read.")
    else:
        print("No violations found in this image.")

    return violation_type_found, plate_text_clean, annotated_img






#store evidence
@app.route('/evidence/<path:filename>')
def serve_evidence_image(filename):
    return send_from_directory('evidence_uploads', filename)




#dashboard ststas

@app.route('/dashboard-stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = db.cursor()

        #Total Vehicles
        cursor.execute("SELECT COUNT(*) FROM Vehicle")
        total_vehicles = cursor.fetchone()[0]

        #Total Violations
        cursor.execute("SELECT COUNT(*) FROM Violations")
        total_violations = cursor.fetchone()[0]

        #Total Fines Paid
        cursor.execute("SELECT SUM(FineAmount) FROM Violations WHERE Status = 'Paid'")
        total_paid_result = cursor.fetchone()[0]
        total_paid = float(total_paid_result or 0) # Handle None if no paid fines

        #Total Fines Unpaid
        cursor.execute("SELECT SUM(FineAmount) FROM Violations WHERE Status = 'Unpaid'")
        total_unpaid_result = cursor.fetchone()[0]
        total_unpaid = float(total_unpaid_result or 0)

        #Most Common Violation
        cursor.execute("""
            SELECT ViolationType, COUNT(*) as count 
            FROM Violations 
            GROUP BY ViolationType 
            ORDER BY count DESC 
            LIMIT 1
        """)
        top_violation_result = cursor.fetchone()
        top_violation = top_violation_result[0] if top_violation_result else "N/A"

        cursor.close()
        db.close()

        #Return all stats as a single JSON object
        return jsonify({
            "total_vehicles": total_vehicles,
            "total_violations": total_violations,
            "total_paid": total_paid,
            "total_unpaid": total_unpaid,
            "top_violation": top_violation
        }), 200

    except Exception as e:
        print(f"Error in /dashboard-stats: {str(e)}")
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500









#My Profile page

@app.route('/my-profile-stats', methods=['GET'])
@jwt_required()
def get_my_profile_stats():
    # Get the username from the currently loggedin user
    current_user_username = get_jwt_identity()
    
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = db.cursor()

        #Get user role
        cursor.execute("SELECT role FROM loginuser WHERE username = %s", (current_user_username,))
        role_result = cursor.fetchone()
        user_role = role_result[0] if role_result else "N/A"

        #Get violations reported by this user
        cursor.execute("SELECT COUNT(*) FROM Violations WHERE ReportedBy = %s", (current_user_username,))
        violations_reported = cursor.fetchone()[0]

        #Get vehicles registered by this user
        cursor.execute("SELECT COUNT(*) FROM Vehicle WHERE RegisteredBy = %s", (current_user_username,))
        vehicles_registered = cursor.fetchone()[0]

        cursor.close()
        db.close()

        return jsonify({
            "username": current_user_username,
            "role": user_role,
            "violations_reported": violations_reported,
            "vehicles_registered": vehicles_registered
        }), 200

    except Exception as e:
        print(f"Error in /my-profile-stats: {str(e)}")
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500








#vehicles stuff


# vehicle registration API
@app.route('/register-vehicle', methods=['POST'])
def register_vehicle():

    data = request.json
    query = "INSERT INTO Vehicle (OwnerName, LicensePlate, VehicleType, Contact, Address) VALUES (%s, %s, %s, %s, %s)"
    values = (data['OwnerName'], data['LicensePlate'], data['VehicleType'], data['Contact'], data['Address'])

    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()
        cursor.execute(query, values)
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Vehicle registered successfully!"}), 201
    except mysql.connector.Error as e:
        return jsonify({"error": str(e)}), 400


#delete a vehcile API
@app.route("/delete-vehicle/<license_plate>", methods=["DELETE"])
@jwt_required()
def delete_vehicle(license_plate):
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    user_role = claims.get("role")

    if user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can perform this action"}), 403
    
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Delete vehicle from the database
    cursor.execute("DELETE FROM Vehicle WHERE LicensePlate = %s", (license_plate,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": f"Vehicle {license_plate} deleted successfully"}), 200


# get all vehicles API
@app.route('/get-vehicles', methods=['GET'])
@jwt_required()
def get_vehicles():
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()
        cursor.execute("SELECT * FROM Vehicle")
        vehicles = cursor.fetchall()
        vehicle_list = [{
            "VehicleID": v[0],
            "OwnerName": v[1],
            "LicensePlate": v[2],
            "VehicleType": v[3],
            "Contact": v[4],
            "Address": v[5]
        } for v in vehicles]
        cursor.close()
        db.close()
        return jsonify(vehicle_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# get vehicle details according to certain license plate
@app.route('/get-vehicle/<license_plate>', methods=['GET'])
def get_vehicle(license_plate):

    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()
        cursor.execute("SELECT * FROM Vehicle WHERE LicensePlate = %s", (license_plate,))
        vehicle = cursor.fetchone()

        if not vehicle:
            cursor.close()
            db.close()
            return jsonify({"error": "Vehicle not found"}), 404

        vehicle_data = {
            "VehicleID": vehicle[0],
            "OwnerName": vehicle[1],
            "LicensePlate": vehicle[2],
            "VehicleType": vehicle[3],
            "Contact": vehicle[4],
            "Address": vehicle[5]
        }
        cursor.close()
        db.close()
        return jsonify(vehicle_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



#violation stuff
# add violation API
@app.route('/add-violation', methods=['POST'])
def add_violation():

    data = request.json

    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()

        # get vehicle ID from license plate
        cursor.execute("SELECT VehicleID FROM Vehicle WHERE LicensePlate = %s", (data['LicensePlate'],))
        vehicle = cursor.fetchone()

        if not vehicle:
            cursor.close()
            db.close()
            return jsonify({"error": "Vehicle not found"}), 404

        vehicle_id = vehicle[0]

        # insert violation
        query = "INSERT INTO Violations (VehicleID, ViolationType, FineAmount, Location) VALUES (%s, %s, %s, %s)"
        values = (vehicle_id, data['ViolationType'], data['FineAmount'], data['Location'])
        cursor.execute(query, values)
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "Violation recorded successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400







#auto detection stuff

@app.route('/autodetect', methods=['POST'])
@jwt_required()
def autodetect_violation():
    if 'image_file' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image_file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        #Read the image file in memory
        contents = file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image file"}), 400
        
        #Runing the ML detection function FIRST to get the annotated image
        violation_type, plate_number, annotated_img = detect_violation_and_plate(img)

        #Handle detection results
        if not violation_type:
            return jsonify({"message": "No violation was detected."}), 200
        
        if not plate_number:
            return jsonify({"message": f"Violation ({violation_type}) detected, but the license plate was unreadable."}), 200

        #SAVE the fule
        file_extension = os.path.splitext(file.filename)[1]
        if not file_extension: # Default to .jpg
            file_extension = ".jpg"
            
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        save_path = os.path.join("evidence_uploads", unique_filename)
        
        # Save the image
        success, encoded_image = cv2.imencode(file_extension, annotated_img)
        if success:
            with open(save_path, "wb") as f:
                f.write(encoded_image)
            print(f"Evidence file saved to: {save_path}")

        #Save to Database
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = db.cursor()

        #Get vehicle ID from license plate
        cursor.execute("SELECT VehicleID FROM Vehicle WHERE LicensePlate = %s", (plate_number,))
        vehicle = cursor.fetchone()

        if not vehicle:
            #auto regis vehicle
            print(f"Vehicle {plate_number} not found. Auto-registering...")
            
            #Get the count
            cursor.execute("SELECT COUNT(*) FROM Vehicle WHERE OwnerName LIKE 'UNKNOWN (%)'")
            count_result = cursor.fetchone()
            unknown_count = count_result[0]
            
            #Create the new unique owner name
            new_owner_name = f"UNKNOWN ({unknown_count + 1}) (Auto-Detected)"

            #Define the query
            register_query = """INSERT INTO Vehicle(OwnerName, LicensePlate, VehicleType, Contact, Address) VALUES (%s, %s, %s, %s, %s)"""
            
            #Use the 'new_owner_name' variable
            placeholder_values = (new_owner_name, plate_number, "Motorcycle", "N/A", "N/A")
            cursor.execute(register_query, placeholder_values)
            db.commit()
            vehicle_id = cursor.lastrowid
            print(f"New vehicle registered with ID: {vehicle_id} and Owner: {new_owner_name}")
        else:
            vehicle_id = vehicle[0]

        default_fine = 500  # Set a default fine for 'No Helmet'
        default_location = "Auto-Detected via Camera"

        # Insert violation
        query = "INSERT INTO Violations (VehicleID, ViolationType, FineAmount, Location, evidence_image) VALUES (%s, %s, %s, %s, %s)"
        values = (vehicle_id, violation_type, default_fine, default_location, unique_filename)
        cursor.execute(query, values)
        db.commit()
        
        cursor.close()
        db.close()
        
        return jsonify({
            "message": "Success! Violation added.",
            "violation_type": violation_type,
            "license_plate": plate_number
        }), 201

    except Exception as e:
        print(f"Error in /autodetect: {str(e)}")
        if 'db' in locals() and db.is_connected():
            db.rollback()
            cursor.close()
            db.close()
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500







#
#iot radar gun
#
@app.route('/iot/report-speeding', methods=['POST'])
def iot_report_speeding():
    #Check for the secret API Key 
    api_key = request.headers.get('X-API-Key')
    if api_key != 'my-secret-iot-key':
        return jsonify({"error": "Unauthorized"}), 401

    #Get the data from the IoT device
    data = request.json
    plate_number = data.get('LicensePlate')
    speed = data.get('Speed')

    if not plate_number or not speed:
        return jsonify({"error": "Missing LicensePlate or Speed"}), 400

    try:
        #same auto regis logic
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("SELECT VehicleID FROM Vehicle WHERE LicensePlate = %s", (plate_number,))
        vehicle = cursor.fetchone()
        vehicle_id = None

        if not vehicle:
            print(f"[IoT] Vehicle {plate_number} not found. Auto-registering...")
            cursor.execute("SELECT COUNT(*) FROM Vehicle WHERE OwnerName LIKE 'UNKNOWN (%)'")
            count_result = cursor.fetchone()
            unknown_count = count_result[0]
            new_owner_name = f"UNKNOWN ({unknown_count + 1}) (Auto-Detected)"

            register_query = """INSERT INTO Vehicle(OwnerName, LicensePlate, VehicleType, Contact, Address) VALUES (%s, %s, %s, %s, %s)"""
            placeholder_values = (new_owner_name, plate_number, "UNKNOWN", "N/A", "N/A")
            
            cursor.execute(register_query, placeholder_values)
            db.commit()
            vehicle_id = cursor.lastrowid
        else:
            vehicle_id = vehicle[0]

        #calc and log fine and violation
        fine_amount = (speed - 90) * 10  
        if fine_amount < 100: fine_amount = 100

        query = """
            INSERT INTO Violations (VehicleID, ViolationType, FineAmount, Location, ReportedBy) 
            VALUES (%s, %s, %s, %s, %s)
        """
        values = (vehicle_id, "Speeding", fine_amount, "Simulated Radar (NH-48)", "IoT-Radar-01")
        
        cursor.execute(query, values)
        db.commit()
        
        cursor.close()
        db.close()
        
        return jsonify({"message": f"Successfully logged speeding violation for {plate_number}"}), 201

    except Exception as e:
        print(f"Error in /iot/report-speeding: {str(e)}")
        if 'db' in locals() and db.is_connected():
            db.rollback()
            cursor.close()
            db.close()
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500






# get violations by license plate
@app.route('/get-violations/<license_plate>', methods=['GET'])
def get_violations(license_plate):

    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()

        # get vehicle ID from license plate
        cursor.execute("SELECT VehicleID FROM Vehicle WHERE LicensePlate = %s", (license_plate,))
        vehicle = cursor.fetchone()

        if not vehicle:
            cursor.close()
            db.close()
            return jsonify({"error": "Vehicle not found"}), 404

        vehicle_id = vehicle[0]

        # fetch violations
        cursor.execute("SELECT * FROM Violations WHERE VehicleID = %s", (vehicle_id,))
        violations = cursor.fetchall()

        if not violations:
            cursor.close()
            db.close()
            return jsonify({"message": "No violations found for this vehicle."}), 404

        results = [{
            "ViolationID": v[0],
            "VehicleID": v[1],
            "DateTime": v[2].strftime('%Y-%m-%d %H:%M:%S'),
            "ViolationType": v[3],
            "FineAmount": float(v[4]),
            "Status": v[5],
            "Location": v[6],
            "evidence_image": v[8] if len(v) > 8 and v[8] is not None else None
        } for v in violations]

        cursor.close()
        db.close()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#get violation from violation id
@app.route('/get-violation/<int:violation_id>', methods=['GET'])
@jwt_required()
def get_violation(violation_id):
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()
        cursor.execute("SELECT * FROM Violations WHERE ViolationID = %s", (violation_id,))
        violation = cursor.fetchone()

        if not violation:
            cursor.close()
            db.close()
            return jsonify({"error": "Violation not found"}), 404

        violation_data = {
            "ViolationID": violation[0],
            "FineAmount": float(violation[4]),
            "Status": violation[5],
        
        }
        cursor.close()
        db.close()
        return jsonify(violation_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


#fines

# pay fine API
@app.route('/pay-fine/<int:violation_id>', methods=['PUT'])
@jwt_required()
def pay_fine(violation_id):
    data = request.json
    payment_method = data.get("PaymentMethod", "Online")
    card_details = data.get("CardDetails", None)  # Only for credit card payments

    try:
        db = get_db_connection()
        if not db:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = db.cursor()
        
        # Verify violation exists and get amount
        cursor.execute("SELECT FineAmount FROM Violations WHERE ViolationID = %s", (violation_id,))
        violation = cursor.fetchone()
        
        if not violation:
            cursor.close()
            db.close()
            return jsonify({"error": "Violation not found"}), 404

        #i havent added any payment gateway here yet
        
        # Update violation status
        cursor.execute("UPDATE Violations SET Status = 'Paid' WHERE ViolationID = %s", (violation_id,))
        db.commit()

        # Record payment
        cursor.execute("""
            INSERT INTO Fines (ViolationID, PaymentStatus, PaymentMethod, DatePaid, Amount) 
            VALUES (%s, 'Completed', %s, NOW(), %s)
        """, (violation_id, payment_method, float(violation[0])))
        db.commit()

        cursor.close()
        db.close()
        return jsonify({"message": "Fine paid successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    

    except mysql.connector.Error as db_error:
        return jsonify({"error": f"Database error: {str(db_error)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Payment processing failed: {str(e)}"}), 400
    
# run the Flask app
if __name__ == '__main__':
    app.run(debug=True)