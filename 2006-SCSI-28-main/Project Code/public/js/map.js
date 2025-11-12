document.addEventListener("DOMContentLoaded", () => {
  window.initMapPage = initMapPage;
});

let mapPageMap;
let userMarker;
let directionsService;
let directionsRenderer;
let markers = [];
let allBinsData = [];
let selectedBin = null;
let currentTravelMode = 'WALKING';

function initMapPage() {

  const defaultCenter = { lat: 1.3521, lng: 103.8198 };


  mapPageMap = new google.maps.Map(document.getElementById("MAP_PAGE"), {
    center: defaultCenter,
    zoom: 12,
  });


  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(mapPageMap);


  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        userMarker = new google.maps.Marker({
          position: userLocation,
          map: mapPageMap,
          title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
          },
        });

        mapPageMap.setCenter(userLocation);
      },
      () => {
        alert("Unable to retrieve your location. Showing default location.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser. Showing default location.");
  }


  fetch("/EwasteRecycling.json")
    .then((response) => response.json())
    .then((data) => {
      allBinsData = data.features;
      
      data.features.forEach((feature, index) => {
        const coords = feature.geometry.coordinates;
        const properties = feature.properties;

        const marker = new google.maps.Marker({
          position: { lat: coords[1], lng: coords[0] },
          map: mapPageMap,
          title: properties.ADDRESSSTREETNAME || "E-waste Bin",
        });

        marker.binData = feature;
        marker.binIndex = index;

        marker.addListener("click", () => {
          displayBinDetails(feature);
          selectedBin = feature;
        });

        markers.push(marker);
      });
      
      const initialDistance = document.getElementById("distanceSlider").value;
      document.getElementById("distanceValue").textContent = `${initialDistance} km`;
    })
    .catch((error) => console.error("Error loading JSON:", error));

  addZoomToMeControl();
}

function calculateAndDisplayRoute() {
  
  if (!selectedBin || !userMarker) {
    alert("Select a bin and enable location services.");
    return;
  }

  if (!directionsService) {
    console.error('DirectionsService not initialized');
    alert("Directions service not ready.");
    return;
  }

  const userLocation = userMarker.getPosition();
  const coords = selectedBin.geometry.coordinates;
  const destination = { lat: coords[1], lng: coords[0] };

  directionsService.route(
    {
      origin: userLocation,
      destination: destination,
      travelMode: getTravelModeEnum(currentTravelMode),
    },
    (response, status) => {
      
      if (status === google.maps.DirectionsStatus.OK) {
        hideMarkersForDirections();
        
        directionsRenderer.setDirections(response);
        
        displayDirections(response);
        
        document.getElementById('directionsPanel').scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        alert("Directions request failed due to " + status);
      }
    }
  );
}

function displayDirections(directionsResult) {
  console.log(directionsResult);
  
  const route = directionsResult.routes[0];
  const leg = route.legs[0];
  
  console.log(route);
  console.log(leg);
  
  const directionsPanel = document.getElementById('directionsPanel');
  console.log(directionsPanel);
  
  directionsPanel.classList.remove('d-none');
  
  const binName = selectedBin.properties.ADDRESSBUILDINGNAME || selectedBin.properties.NAME || 'E-waste Bin';
  document.getElementById('directionDestination').textContent = binName;
  
  document.getElementById('directionDuration').textContent = leg.duration.text;
  document.getElementById('directionDistance').textContent = leg.distance.text;
  
  const stepsContainer = document.getElementById('directionsSteps');
  stepsContainer.innerHTML = '';
  
  leg.steps.forEach((step, index) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'p-3 mb-2 bg-light border-start border-3 border-secondary rounded-end';
    
    const cleanInstructions = step.instructions.replace(/<[^>]*>/g, '');  //remove html tags from api response
    
    //step innerHTML
    stepDiv.innerHTML = `
      <div class="d-flex align-items-start">
        <span class="bg-secondary text-white fw-bold rounded-circle d-inline-flex align-items-center justify-content-center me-3" style="width: 30px; height: 30px; font-size: 0.875rem;">${index + 1}</span>
        <div class="flex-grow-1">
          <div class="fw-semibold">${cleanInstructions}</div>
          <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 0;">${step.distance.text} - ${step.duration.text}</p>
        </div>
      </div>
    `;
    
    stepsContainer.appendChild(stepDiv);
  });
}

function changeTravelMode(mode) {
  
  currentTravelMode = mode;
  
  try {
    document.getElementById('walkingBtn').className = 'btn ' + (mode === 'WALKING' ? 'btn-secondary active' : 'btn-outline-secondary');
    document.getElementById('drivingBtn').className = 'btn ' + (mode === 'DRIVING' ? 'btn-secondary active' : 'btn-outline-secondary');
    document.getElementById('transitBtn').className = 'btn ' + (mode === 'TRANSIT' ? 'btn-secondary active' : 'btn-outline-secondary');
    
    const directionsPanel = document.getElementById('directionsPanel');
    if (directionsPanel && !directionsPanel.classList.contains('d-none')) {
      calculateAndDisplayRoute();
    }
  } catch (error) {
    console.error('Error in changeTravelMode:', error);
  }
}

function getTravelModeEnum(mode) {
  switch(mode) {
    case 'WALKING':
      return google.maps.TravelMode.WALKING;
    case 'DRIVING':
      return google.maps.TravelMode.DRIVING;
    case 'TRANSIT':
      return google.maps.TravelMode.TRANSIT;
    default:
      return google.maps.TravelMode.WALKING;
  }
}

function applyAllFilters() {
  const searchQuery = document.getElementById("searchBar").value.toLowerCase();
  const selectedType = document.getElementById('ewasteTypeFilter').value;
  const distance = parseFloat(document.getElementById("distanceSlider").value);
  
  markers.forEach((marker) => {
    let showMarker = true;
    
    if (searchQuery) {
      const name = marker.getTitle() || '';
      const address = marker.binData.properties.ADDRESSSTREETNAME || '';
      const building = marker.binData.properties.ADDRESSBUILDINGNAME || '';
      const searchText = (name + ' ' + address + ' ' + building).toLowerCase();
      if (!searchText.includes(searchQuery)) {
        showMarker = false;
      }
    }
    
    if (showMarker && selectedType !== 'all') {
      const description = marker.binData.properties.DESCRIPTION || '';
      let typeMatch = false;
      
      switch (selectedType) {
        case 'ict':
          typeMatch = description.includes('ICT equipment');
          break;
        case 'batteries':
          typeMatch = description.includes('Batteries');
          break;
        case 'lamps':
          typeMatch = description.includes('Lamps');
          break;
        case 'appliances':
          typeMatch = description.includes('Non-regulated') || description.includes('appliances');
          break;
      }
      
      if (!typeMatch) {
        showMarker = false;
      }
    }
    
    if (showMarker && userMarker) {
      const userLocation = userMarker.getPosition();
      const markerPosition = marker.getPosition();
      const distanceToMarker = google.maps.geometry.spherical.computeDistanceBetween(userLocation, markerPosition) / 1000;
      
      if (distanceToMarker > distance) {
        showMarker = false;
      }
    }
    
    if (showMarker) {
      marker.setVisible(true);
    } else {
      marker.setVisible(false);
    }
  });
}

function searchBins() {
  applyAllFilters();
}

function filterByDistance() {
  const distance = document.getElementById("distanceSlider").value;
  document.getElementById("distanceValue").textContent = `${distance} km`;
  applyAllFilters();
}

function displayBinDetails(binData) {
  const properties = binData.properties;
  
  document.getElementById('defaultState').classList.add('d-none');
  document.getElementById('selectedBinDetails').classList.remove('d-none');
  
  document.getElementById('binName').textContent = properties.ADDRESSBUILDINGNAME || properties.NAME || 'E-waste Collection Point';
  document.getElementById('binAddress').textContent = properties.ADDRESSSTREETNAME || 'Address not available';
  
  let ewasteTypes = [];
  if (properties.DESCRIPTION) {
    if (properties.DESCRIPTION.includes('ICT equipment')) ewasteTypes.push('ICT Equipment');
    if (properties.DESCRIPTION.includes('Batteries')) ewasteTypes.push('Batteries');
    if (properties.DESCRIPTION.includes('Lamps')) ewasteTypes.push('Lamps');
    if (properties.DESCRIPTION.includes('Non-regulated')) ewasteTypes.push('Small Appliances');
  }
  
  if (ewasteTypes.length === 0) {
    ewasteTypes.push('General E-waste');
  }
  
  let displayText = ewasteTypes.length > 2 ? 'Multiple Types' : ewasteTypes.join(', ');
  document.getElementById('binType').textContent = displayText;
  
  document.getElementById('binDescription').textContent = properties.DESCRIPTION || 'E-waste collection point. Check accepted items before disposal.';
}

function filterByEwasteType() {
  applyAllFilters();
}

function resetFilters() {
  document.getElementById('searchBar').value = '';
  
  document.getElementById('ewasteTypeFilter').value = 'all';
  
  document.getElementById('distanceSlider').value = 50;
  document.getElementById('distanceValue').textContent = '50 km';
  
  showAllMarkers();
  
  if (userMarker) {
    mapPageMap.setCenter(userMarker.getPosition());
    mapPageMap.setZoom(12);
  } else {
    mapPageMap.setCenter({ lat: 1.3521, lng: 103.8198 });
    mapPageMap.setZoom(12);
  }
  
  document.getElementById('selectedBinDetails').classList.add('d-none');
  document.getElementById('defaultState').classList.remove('d-none');
  
  document.getElementById('directionsPanel').classList.add('d-none');
  directionsRenderer.setDirections({routes: []});
  
  selectedBin = null;
  
  applyAllFilters();
}

function centerMapOnBin() {
  if (selectedBin) {
    const coords = selectedBin.geometry.coordinates;
    mapPageMap.setCenter({ lat: coords[1], lng: coords[0] });
    mapPageMap.setZoom(16);
  }
}

function hideMarkersForDirections() {
  markers.forEach(marker => {
    if (marker.binData !== selectedBin) {
      marker.setVisible(false);
    }
  });
}

function showAllMarkers() {
  //reapply current filters
  applyAllFilters();
}

function addZoomToMeControl() {
  const controlDiv = document.createElement("div");
  controlDiv.style.margin = "10px";

  const zoomButton = document.createElement("button");
  zoomButton.textContent = "Zoom to Me";
  zoomButton.style.cssText = "background-color: #3498db; color: white; border: none; padding: 10px; cursor: pointer; font-size: 14px; border-radius: 4px;";

  zoomButton.addEventListener("click", () => {
    if (userMarker) {
      const userLocation = userMarker.getPosition();
      mapPageMap.setCenter(userLocation);
      mapPageMap.setZoom(15);
    } else {
      alert("User location not available.");
    }
  });

  controlDiv.appendChild(zoomButton);

  mapPageMap.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv);
}