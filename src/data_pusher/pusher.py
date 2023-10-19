import requests
from random import randint
from time import sleep
base_url = "http://127.0.0.1:8000/update/"

for i in range(1,20001):
    data = {
        "coordinates_lat": randint(30, 42)+randint(100,999)/1000,
        "coordinates_long": -randint(70, 115)-randint(100,999)/1000,
        "status": ['Active', 'Inactive', 'In Repair'][randint(0,2)],
        "battery_percentage": randint(30, 95)+randint(100,999)/1000,
        "battery_health": randint(30, 95)+randint(100,999)/1000,
    }
    requests.put(base_url+str(i),json=data)
    sleep(0.9)