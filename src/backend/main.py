import sqlalchemy as db
from sqlalchemy.orm import Session
from model import *
from random import randint
import os
from flask import Flask, request, jsonify
import jwt
from random import randint
import datetime
from functools import wraps
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'COME SECRET KEY'
CORS(app)
# Not using user DB for demo
users = {
    'khush@me.com': 'pass',
}

engine = db.create_engine(os.environ.get("MYSQL_CONN_STRING"))

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization') 
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403

        try:
            token = token.replace("Bearer","").strip()
            data = jwt.decode(token, app.config['SECRET_KEY'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 403

        return f(*args, **kwargs)
    return decorated


# 1 API to get upsert vehicle data
@app.route("/update/<int:vehicle_id>", methods=["PUT"])
def update_value(vehicle_id):
    data = request.json
    session = Session(engine)
    vehicle = session.query(Vehicle).filter_by(vehicle_id=vehicle_id).first()
    msg = ""
    if vehicle:
        vehicle.battery_percentage = data["battery_percentage"]
        vehicle.coordinates_lat = data["coordinates_lat"]
        vehicle.coordinates_long = data["coordinates_long"]
        vehicle.status = data["status"]
        vehicle.battery_health = data["battery_health"]
        msg = f"Updated values for {vehicle_id}"
    else:
        new_vehicle = Vehicle(
            vehicle_id = vehicle_id,
            model="ABCDEFGHIJKLMNOPQRSTUVWXYZ"[randint(0,25)],
            owner_id=randint(1,400000),
            coordinates_lat= data["coordinates_lat"],
            coordinates_long=data["coordinates_long"],
            status=data["status"],
            battery_percentage=data["battery_percentage"],
            battery_health=data["battery_health"]
        )
        session.add(new_vehicle)
        msg = f"Added value for vehicle id {vehicle_id}"
    session.commit()
    session.close()
    return jsonify({"result": msg})

# 2 API to get all vehicle geojson

@app.route("/geo.json", methods=["GET"])
@token_required
def get_geo_json():
    session = Session(engine) 
    results = session.query(Vehicle.vehicle_id, Vehicle.coordinates_lat, Vehicle.coordinates_long).all()
    features = []
    # k = randint(4,10)
    # i = 0
    for row in results:
        # i+=1
        # if i%k==0:
        #     # Having skips in order to show refresh on front end
        #     continue
        
        vehicle_id, coordinates_lat, coordinates_long = row
        features.append({
            "type": "Feature",
            "properties": {"id":vehicle_id},
            "geometry": { "type": "Point", "coordinates": [ float(coordinates_long), float(coordinates_lat) ] }
        })
    # Close the session
    session.close()
    response = jsonify({
        "type": "FeatureCollection",
        "features": features
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response
# pprint(get_geo_json())

# 3 API to get single vehicle in detail
@app.route("/vehicle/<int:vehicle_id>", methods=["GET"])
@token_required
def get_vehilce_details(vehicle_id):
    session = Session(engine)
    vehicle = session.query(Vehicle).filter_by(vehicle_id=vehicle_id).first()
    if vehicle:
        response = jsonify({
            "vehicle_id": vehicle.vehicle_id,
            "model": vehicle.model,
            "owner_id": vehicle.owner_id,
            "coordinates_lat": float(vehicle.coordinates_lat),
            "coordinates_long": float(vehicle.coordinates_long),
            "battery_percentage": float(vehicle.battery_percentage),
            "battery_health": float(vehicle.battery_health),
            "status": vehicle.status,
            "updated_at": vehicle.updated_at,
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    else:
        return None


# 4 API to get jwt token
@app.route('/login', methods=['POST'])
def login():
    auth = request.json
    if not auth or not auth["email"] or not auth["password"]:
        response = jsonify({'message': 'Authentication required!'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 401

    if auth["email"] in users and users[auth["email"]] == auth["password"]:
        token = jwt.encode({'user': auth["email"], 'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)}, app.config['SECRET_KEY'])
        response = jsonify({'token': token.decode('utf-8')})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    response = jsonify({'message': 'Authentication failed!'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, 401

if __name__ == "__main__":
    app.run(debug=True, port=8000)