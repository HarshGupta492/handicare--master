// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map (will be shown when needed)
    initMap();
});

// Map initialization
let map;
let markers = [];
let infoWindow;
let autocomplete;
let directionsService;
let directionsRenderer;
let currentLocation;

function initMap() {
    // Default to New Delhi coordinates
    const defaultLocation = { lat: 28.6139, lng: 77.2090 };
    
    map = new google.maps.Map(document.getElementById('hospital-map'), {
        zoom: 12,
        center: defaultLocation,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
    });

    infoWindow = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });

    // Initialize the Places Autocomplete
    const input = document.getElementById('place-search');
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['hospital', 'health'],
        componentRestrictions: { country: 'in' }
    });

    // Add event listeners for filters
    document.getElementById('hospital-type').addEventListener('change', function() {
        if (currentLocation) {
            searchNearbyHospitals(currentLocation);
        }
    });

    document.getElementById('distance-filter').addEventListener('change', function() {
        if (currentLocation) {
            searchNearbyHospitals(currentLocation);
        }
    });

    // Add current location marker
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            map.setCenter(currentLocation);
            
            // Add marker for current location
            new google.maps.Marker({
                position: currentLocation,
                map: map,
                title: 'Your Location',
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }
            });

            // Search for nearby hospitals
            searchNearbyHospitals(currentLocation);
        });
    }

    // Add search button click handler
    document.getElementById('search-button').addEventListener('click', function() {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            currentLocation = place.geometry.location;
            map.setCenter(currentLocation);
            map.setZoom(15);
            searchNearbyHospitals(currentLocation);
        }
    });

    // Add enter key handler for search input
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                currentLocation = place.geometry.location;
                map.setCenter(currentLocation);
                map.setZoom(15);
                searchNearbyHospitals(currentLocation);
            }
        }
    });
}

function searchNearbyHospitals(location) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    directionsRenderer.setMap(null);

    // Use MapmyIndia's search API
    const searchService = new MapmyIndia.Search();
    const request = {
        query: 'hospital',
        location: [location.lat, location.lng],
        radius: 5000 // 5km radius
    };

    searchService.search(request, function(results, status) {
        if (status === 'OK') {
            results.forEach(function(place) {
                createMarker(place);
            });
        }
    });
}

function searchHospitals(map, query) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    const searchService = new MapmyIndia.Search();
    const request = {
        query: query + ' hospital',
        location: map.getCenter(),
        radius: 5000
    };

    searchService.search(request, function(results, status) {
        if (status === 'OK') {
            results.forEach(function(place) {
                createMarker(map, place);
            });
        }
    });
}

function createMarker(place) {
    const marker = new MapmyIndia.Marker({
        position: [place.latitude, place.longitude],
        map: map,
        title: place.placeName
    });

    marker.addListener('click', function() {
        const content = `<div class="hospital-info">
            <h3>${place.placeName}</h3>
            <p><strong>Address:</strong> ${place.address}</p>
            ${place.phone ? `<p><strong>Phone:</strong> ${place.phone}</p>` : ''}
            ${place.website ? `<p><strong>Website:</strong> <a href="${place.website}" target="_blank">Visit Website</a></p>` : ''}
            <button class="directions-button" onclick="getDirections(${place.latitude}, ${place.longitude})">
                Get Directions
            </button>
        </div>`;

        const infoWindow = new MapmyIndia.InfoWindow({
            content: content
        });

        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function getDirections(destLat, destLng) {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(function(position) {
        const start = [position.coords.latitude, position.coords.longitude];
        const end = [destLat, destLng];

        const directionsService = new MapmyIndia.Directions();
        directionsService.route({
            origin: start,
            destination: end,
            travelMode: 'DRIVING'
        }, function(response, status) {
            if (status === 'OK') {
                const directionsRenderer = new MapmyIndia.DirectionsRenderer({
                    map: map,
                    directions: response,
                    suppressMarkers: true
                });
            }
        });
    });
}

// Medication Information
function toggleMedicationInfo() {
    const infoDiv = document.getElementById('medication-info');
    infoDiv.style.display = infoDiv.style.display === 'none' ? 'block' : 'none';
}

function showMedicationDetails(medicationId) {
    const detailsDiv = document.getElementById('medication-details');
    const medicationData = {
        med1: {
            name: 'Medication 1',
            dosage: '500mg',
            frequency: 'Twice daily',
            sideEffects: 'Dizziness, nausea',
            instructions: 'Take with food'
        },
        med2: {
            name: 'Medication 2',
            dosage: '100mg',
            frequency: 'Once daily',
            sideEffects: 'Headache, fatigue',
            instructions: 'Take in the morning'
        },
        med3: {
            name: 'Medication 3',
            dosage: '250mg',
            frequency: 'Three times daily',
            sideEffects: 'None reported',
            instructions: 'Take with water'
        }
    };

    if (medicationId && medicationData[medicationId]) {
        const med = medicationData[medicationId];
        detailsDiv.innerHTML = `
            <div class="medication-details">
                <h5>${med.name}</h5>
                <p><strong>Dosage:</strong> ${med.dosage}</p>
                <p><strong>Frequency:</strong> ${med.frequency}</p>
                <p><strong>Side Effects:</strong> ${med.sideEffects}</p>
                <p><strong>Instructions:</strong> ${med.instructions}</p>
            </div>
        `;
    } else {
        detailsDiv.innerHTML = '';
    }
}

// Medical History
function toggleMedicalHistory() {
    const historyDiv = document.getElementById('medical-history');
    historyDiv.style.display = historyDiv.style.display === 'none' ? 'block' : 'none';
}

function showHistoryDetails(category) {
    const detailsDiv = document.getElementById('history-details');
    const historyData = {
        allergies: ['Penicillin', 'Peanuts', 'Dust'],
        conditions: ['Hypertension', 'Type 2 Diabetes'],
        surgeries: ['Appendectomy (2010)', 'Knee Surgery (2015)'],
        medications: ['Blood Pressure Medication', 'Diabetes Medication']
    };

    if (category && historyData[category]) {
        detailsDiv.innerHTML = `
            <div class="history-details">
                <ul>
                    ${historyData[category].map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    } else {
        detailsDiv.innerHTML = '';
    }
}

// Emergency Guide
function toggleEmergencyGuide() {
    const guideDiv = document.getElementById('emergency-guide');
    guideDiv.style.display = guideDiv.style.display === 'none' ? 'block' : 'none';
}

function showGuideDetails(emergencyType) {
    const detailsDiv = document.getElementById('guide-details');
    const guideData = {
        heart: {
            title: 'Heart Attack',
            steps: [
                'Call emergency services immediately (108)',
                'Have the person sit down and rest',
                'Loosen any tight clothing',
                'If prescribed, help them take their nitroglycerin',
                'Begin CPR if the person becomes unconscious'
            ]
        },
        stroke: {
            title: 'Stroke',
            steps: [
                'Call emergency services immediately (108)',
                'Note the time when symptoms first appeared',
                'Have the person lie down with their head slightly elevated',
                'Do not give them anything to eat or drink',
                'Monitor their breathing and consciousness'
            ]
        },
        choking: {
            title: 'Choking',
            steps: [
                'Ask "Are you choking?"',
                'If they can cough, encourage them to continue',
                'If they cannot cough, perform abdominal thrusts (Heimlich maneuver)',
                'Call emergency services if the obstruction is not cleared',
                'Begin CPR if the person becomes unconscious'
            ]
        },
        burns: {
            title: 'Burns',
            steps: [
                'Remove the person from the source of the burn',
                'Cool the burn with cool (not cold) running water',
                'Remove any jewelry or tight clothing near the burn',
                'Cover the burn with a clean, dry cloth',
                'Do not apply creams, ointments, or home remedies'
            ]
        },
        bleeding: {
            title: 'Severe Bleeding',
            steps: [
                'Call emergency services immediately (108)',
                'Apply direct pressure to the wound with a clean cloth',
                'Elevate the injured area if possible',
                'If bleeding soaks through the cloth, add more layers',
                'Do not remove the original cloth'
            ]
        }
    };

    if (emergencyType && guideData[emergencyType]) {
        const guide = guideData[emergencyType];
        detailsDiv.innerHTML = `
            <div class="guide-details">
                <h5>${guide.title}</h5>
                <ol>
                    ${guide.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        `;
    } else {
        detailsDiv.innerHTML = '';
    }
} 