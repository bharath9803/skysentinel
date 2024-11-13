let mode = 'Car';
let speed = 0;
let battery = 100;
let lat = 37.7749; // Default latitude (San Francisco)
let lon = -122.4194; // Default longitude
let altitude = 0; // Altitude for drone
let signalStrength = 100; // Placeholder signal strength
let map, marker;
let pathCoordinates = [];
let vehiclePath;

// Initialize Google Map
function initMap() {
    // Check if geolocation is available in the browser
    if (navigator.geolocation) {
        // Request the current position from the user
        navigator.geolocation.getCurrentPosition((position) => {
            lat = position.coords.latitude;
            lon = position.coords.longitude;

            const initialLocation = { lat: lat, lng: lon };

            // Initialize the Google Map centered at the current location
            map = new google.maps.Map(document.getElementById("map"), {
                center: initialLocation,
                zoom: 14,
            });

            // Place a marker at the current location
            marker = new google.maps.Marker({
                position: initialLocation,
                map: map,
                title: "Current Location",
            });

            // Update the dashboard with the current location
            updateLocation(lat, lon);
            updateDashboard();  // Make sure the dashboard is updated with the new location
        }, () => {
            handleLocationError(true, map);
        }, {
            enableHighAccuracy: true,  // Request a more accurate location
            timeout: 5000,             // Timeout if the request takes more than 5 seconds
            maximumAge: 0              // Don't use cached location
        });
    } else {
        handleLocationError(false, map);
    }
}


function handleLocationError(browserHasGeolocation, map) {
    const infoWindow = new google.maps.InfoWindow({ map });
    infoWindow.setPosition(map.getCenter());
    infoWindow.setContent(
        browserHasGeolocation
            ? "Error: The Geolocation service failed."
            : "Error: Your browser doesn't support geolocation."
    );
}

function updateLocation(lat, lon) {
    window.lat = lat;
    window.lon = lon;
    updatePath(lat, lon);
    fetchWeatherData();
}

function updateDashboard() {
    const modeElement = document.getElementById('mode');
    const speedElement = document.getElementById('speed');
    const batteryElement = document.getElementById('battery');
    const locationElement = document.getElementById('location');
    const weatherElement = document.getElementById('weather');
    const batteryPredictionElement = document.getElementById('battery-prediction');
    const vehicleImage = document.getElementById('vehicle-image');

    if (modeElement) modeElement.innerText = mode;
    if (speedElement) speedElement.innerText = speed.toFixed(2) + " km/h";
    if (batteryElement) batteryElement.innerText = battery.toFixed(1) + "%";
    if (locationElement) locationElement.innerText = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    if (weatherElement) weatherElement.innerText = `Weather: N/A`;  // Replace this with dynamic weather data
    if (batteryPredictionElement) batteryPredictionElement.innerText = `Battery Prediction: N/A`;  // Replace with your logic

    if (vehicleImage) vehicleImage.src = mode === 'Car' ? 'image/cardrone.webp' : 'image/drone.png';

    updateCharts();  // Call chart update logic
}

function updatePath(lat, lon) {
    pathCoordinates.push({ lat: lat, lng: lon });
    if (!vehiclePath) {
        vehiclePath = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        vehiclePath.setMap(map);
    } else {
        vehiclePath.setPath(pathCoordinates);
    }
}

function checkGeofence(lat, lon) {
    const geofenceRadius = 500; // meters
    const geofenceCenter = { lat: 37.7749, lng: -122.4194 }; // Example center (San Francisco)

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(lat, lon),
        new google.maps.LatLng(geofenceCenter.lat, geofenceCenter.lng)
    );

    if (distance > geofenceRadius) {
        alert('Warning: You are outside the geofenced area!');
    }
}

function fetchWeatherData() {
    const apiKey = '1468ab7b9f468472200c1b77b97324f3';
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            const temperature = data.main.temp - 273.15; // Convert from Kelvin to Celsius
            const weatherDescription = data.weather[0].description;
            document.getElementById('weather').innerText = `Temperature: ${temperature.toFixed(2)}°C, Weather: ${weatherDescription}`;
        });
}

function switchMode() {
    mode = mode === 'Car' ? 'Drone' : 'Car';
    updateDashboard();
}

// Predict battery life based on speed (simplified model)
function predictBatteryLife(speed, battery) {
    let estimatedTime = (battery / speed) * 100; // Simplified model
    document.getElementById('battery-prediction').innerText = `Estimated battery life: ${estimatedTime.toFixed(1)} hours`;
}

let speedChart = new Chart(document.getElementById('speedChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Speed (km/h)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1
        }]
    }
});

let batteryChart = new Chart(document.getElementById('batteryChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Battery (%)',
            data: [],
            borderColor: 'rgba(255, 99, 132, 1)',
            tension: 0.1
        }]
    }
});

function updateCharts() {
    if (speedChart.data.labels.length >= 10) {
        speedChart.data.labels.shift();
        speedChart.data.datasets[0].data.shift();
    }
    speedChart.data.labels.push(new Date().toLocaleTimeString());
    speedChart.data.datasets[0].data.push(speed);

    if (batteryChart.data.labels.length >= 10) {
        batteryChart.data.labels.shift();
        batteryChart.data.datasets[0].data.shift();
    }
    batteryChart.data.labels.push(new Date().toLocaleTimeString());
    batteryChart.data.datasets[0].data.push(battery);

    speedChart.update();
    batteryChart.update();
}
