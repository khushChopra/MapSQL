# Vehicle tracker map UI

This application has to parts -
1. Front end - 
    It has the display logic, allows person to log in, see and interact with map UI.
2. Back end - 
    It allows to interact with the vehicles, returns minified data for display of on the map UI, detailed data when we have clicked on one vehicle.

Simulation parts -
1. Data ingestion - 
    This is just a script which updates the coordinates and meta info of vehicles routinely. 

Constriants -
20,000 Vehicles
6 hr interval between updates, ~ 1 update per second

## Solution -

### Backend -
As the data is not really realtime, we can add cache in the endpoint which gets all vehicle data.

As another optimization, we could add a consilidator for updates. Example - Group updates in 10 seconds and run all operations together. (Not implementing it right now)

#### APIs -
1. /update/{vehicle_id} [PUT] Upsert data
2. /vehicle/{vehicle_id} [GET] Get vehicle detail (Protected by auth)
3. /geo.json [GET] Get an optimized and condensed geojson file (Protected by auth)
3. /login [POST] Authenticates a uses, returns JWT bearer token


### Front end -
Uses react, has sinlge screen which goes away after login.

Map box will get the geojson from the link. it requires authentication using Bearer token.

### Data Pusher -
Simple script that loops over all numbers from 1 to 20k and upserts data for vehicle for that ID

### DB -
Commands to setup a mysql database for vehicles

## How to run

### Backend -
1. run `pip install Flask PyJWT SQLAlchemy`
2. Source src/vars.sh
3. Run `python src/backend/main.py`

### Data pusher
1. Run `python src/data_pusher/pusher.py`

### Front end -
1. cd into src/frontend
2. run `npm i`
3. run `npm run start`
