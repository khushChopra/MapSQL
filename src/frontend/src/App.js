import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios'

import TextField from '@mui/material/TextField';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { common } from '@mui/material/colors';


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));


let map = null;

function App() {
	const [ logged, setLogged ] = useState(false)
	const [ email, setEmail ] = useState("")
	const [ errMsg, setErrMsg ] = useState("")
	const [ password, setPassword ] = useState("")
	const [ token, setToken ] = useState("")
	useEffect(() => {
		var mapboxgl = require("mapbox-gl/dist/mapbox-gl.js");
		mapboxgl.accessToken =
		"pk.eyJ1Ijoia2h1c2hjaG9wcmEiLCJhIjoiY2xreTM1a2NsMG8xdDNmbjBqMDJrd2dqMSJ9.2184okVyMNzrDoHeZNK-5Q";
		map = new mapboxgl.Map({
			container: "map",
			style: "mapbox://styles/mapbox/dark-v11",
			center: [-100, 40],
			zoom: 3,
		});


		map.on("load", () => {
		if(!map.getSource("properties")){
			map.addSource("properties", {
				type: "geojson",
				data: {},
				cluster: true,
				clusterMaxZoom: 14, // Max zoom to cluster points on
				clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
			});
		}

		map.addLayer({
			id: "clusters",
			type: "circle",
			source: "properties",
			filter: ["has", "point_count"],
			paint: {
			// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
			// with three steps to implement three types of circles:
			//   * Blue, 20px circles when point count is less than 100
			//   * Yellow, 30px circles when point count is between 100 and 750
			//   * Pink, 40px circles when point count is greater than or equal to 750
			"circle-color": "#11b4da",
			"circle-radius": [
				"interpolate",
				["linear"],
				["get", "point_count"],
				1, 20,
				20000, 800
			],
			},
		});

		map.addLayer({
			id: "cluster-count",
			type: "symbol",
			source: "properties",
			filter: ["has", "point_count"],
			layout: {
			"text-field": ["get", "point_count_abbreviated"],
			"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
			"text-size": 12,
			},
		});

		map.addLayer({
			id: "unclustered-point",
			type: "circle",
			source: "properties",
			filter: ["!", ["has", "point_count"]],
			paint: {
			"circle-color": "#8B0000",
			"circle-radius": 5,
			"circle-stroke-width": 3,
			"circle-stroke-color": "#fff",
			},
		});

		map.on("click", "clusters", (e) => {
			const features = map.queryRenderedFeatures(e.point, {
			layers: ["clusters"],
			});
			const clusterId = features[0].properties.cluster_id;
			map.getSource("properties").getClusterExpansionZoom(
			clusterId,
			(err, zoom) => {
				if (err) return;
				map.easeTo({
				center: features[0].geometry.coordinates,
				zoom: zoom,
				});
			}
			);
		});

		// When a click event occurs on a feature in
		// the unclustered-point layer, open a popup at
		// the location of the feature, with
		// description HTML from its properties.
		map.on("click", "unclustered-point", (e) => {
			const coordinates = e.features[0].geometry.coordinates.slice();
			const title = e.features[0].properties.propertyTitle;
			const image = e.features[0].properties.image;
			const price = e.features[0].properties.price;
			
			// Ensure that if the map is zoomed out such that
			// multiple copies of the feature are visible, the
			// popup appears over the copy being pointed to.
			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}
			const popup = new mapboxgl.Popup()
			.setLngLat(coordinates)
			.setHTML(`
				<p>Long ${e.features[0].geometry.coordinates[0]}</p>
				<p>Lat ${e.features[0].geometry.coordinates[1]}</p>
				<p>ID ${e.features[0].properties.id}</p>
			`)
			.addTo(map);

			axios.get(`http://localhost:8000/vehicle/${e.features[0].properties.id}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
				.then(function (response) {
					var data = response.data
					popup.setHTML(`
						<p>Long: ${data.coordinates_long}</p>
						<p>Lat: ${data.coordinates_lat}</p>
						<p>status: ${data.status}</p>
						<p>battery_percentage: ${data.battery_percentage}</p>
						<p>model: ${data.model}</p>
					`)
				})
				.catch(function (error) {
					console.error('Error:', error);
				});

		});

		map.on("mouseenter", "clusters", () => {
			map.getCanvas().style.cursor = "pointer";
		});
		map.on("mouseleave", "clusters", () => {
			map.getCanvas().style.cursor = "";
		});
		map.on("mouseenter", "unclustered-point", () => {
			map.getCanvas().style.cursor = "pointer";
		});
		map.on("mouseleave", "unclustered-point", () => {
			map.getCanvas().style.cursor = "";
		});
		});
	}, [logged])
	
	useEffect(() => {
		if (logged) {
			console.log("SSS")
			axios.get(
				"http://localhost:8000/geo.json",
				{
					headers: {
						'Authorization': `Bearer ${token}`
					}
				}
			).then(function (response) {
				var data = response.data
				map.getSource("properties").setData(data)	
			})
			.catch(function (error) {
				console.error('Error:', error);
			});
		}
		setInterval(() => {
			if (logged) {
				axios.get(
					"http://localhost:8000/geo.json",
					{
						headers: {
							'Authorization': `Bearer ${token}`
						}
					}
				).then(function (response) {
					var data = response.data
					map.getSource("properties").setData(data)	
				})
				.catch(function (error) {
					console.error('Error:', error);
				});
			}
		}, 5000)
	}, [logged])

	let loginUser = () => {
		axios.post("http://127.0.0.1:8000/login", {
			"email": email,
			"password": password
		})
			.then(function (response) {
				setToken(response.data["token"])
				setLogged(true)
			})
			.catch(function (error) {
				// Handle error, e.g., by logging the error message
				setErrMsg("er")
			});
	}

  return (
	<Box sx={{ flexGrow: 1, height: "100%" }}>
			<div>
				<div className="navbar">
					<ul>
						<li><a href="#">Home</a></li>
						<li><a href="#">About</a></li>
						<li><a href="#">Services</a></li>
						<li><a href="#">Portfolio</a></li>
						<li><a href="#">Contact</a></li>
					</ul>
				</div>
			</div>

			<Item id="map">
			</Item>
          
		  {
			!logged && (

					<Item id="card" >
					<div style={{height: "40vh", zIndex: 50, backgroundColor: "white", padding:"20px", margin:"40px",
						borderRadius: "5px"	
					}}>
						<Typography variant="h5" gutterBottom>
							Hi, welcome to Coulomb AI!
						</Typography>
						<Typography variant="h6" style={{marginTop: "20px"}} gutterBottom>
							Please log in
						</Typography>
						<div>
							<TextField label="Email" style={{width: "100%", marginTop: "20px"}} variant="outlined" value={email} onChange={e => setEmail(e.target.value)} />
						</div>
						<div>
							<TextField type="password" label="Password" style={{width: "100%", marginTop: "20px"}} variant="outlined" value={password} onChange={e => setPassword(e.target.value)} />
						</div>
						{ errMsg!="" && <Alert severity="error">Incorret credentials</Alert> }
						<Button variant="contained" style={{marginTop: "20px"}} onClick={() => loginUser()}>
							Login
						</Button>
					</div>
				</Item>
			)
		  }
    </Box>
  );
}

export default App;