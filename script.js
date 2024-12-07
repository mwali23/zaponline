// Updated script.js
let geojsonLayer; // Global variable to store the GeoJSON layer
let currentData; // Global variable to store the loaded data

// Initialize the map
const map = L.map('map').setView([-13.0439, 28.3889], 9); // starting point of map Copperbelt, Zambia

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetMap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create a layer group for labels
const labelsLayer = L.layerGroup().addTo(map);

// Function to create status update modal
function createStatusUpdateModal() {
  const modal = document.createElement('div');
  modal.id = 'status-update-modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.zIndex = '1000';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  
  modal.innerHTML = `
    <div style="background-color: white; width: 300px; margin: 100px auto; padding: 20px; border-radius: 5px;">
      <h2>Update Power Status</h2>
      <form id="status-update-form">
        <label for="district">District:</label>
        <input type="text" id="district" name="district" readonly><br><br>
        
        <label for="status">Power Status:</label>
        <select id="status" name="status">
          <option value="powered">Powered</option>
          <option value="outage">Outage</option>
          <option value="other">Other</option>
        </select><br><br>
        
        <label for="start-time">Outage Start Time:</label>
        <input type="datetime-local" id="start-time" name="start-time"><br><br>
        
        <label for="end-time">Outage End Time:</label>
        <input type="datetime-local" id="end-time" name="end-time"><br><br>
        
        <button type="submit">Update Status</button>
        <button type="button" id="cancel-update">Cancel</button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Cancel button functionality
  document.getElementById('cancel-update').addEventListener('click', () => {
    modal.style.display = 'none'; // Hide the modal
  });
  
  // Form submission handling
  document.getElementById('status-update-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const districtName = document.getElementById('district').value;
    const newStatus = document.getElementById('status').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    // Update the GeoJSON data
    currentData = updateDistrictStatus(districtName, newStatus, startTime, endTime);
    
    // Redraw the map with updated data
    updateMapDisplay(currentData);
    
    // Hide the modal
    modal.style.display = 'none';
  });
  
  return modal;
}

// Function to update district status in the data
function updateDistrictStatus(districtName, newStatus, startTime = '', endTime = '') {
  // Create a deep copy of the current data to avoid direct mutation
  const updatedData = JSON.parse(JSON.stringify(currentData));
  
  // Find and update the specific district
  updatedData.features = updatedData.features.map(feature => {
    if (feature.properties.NAME_2 === districtName) {
      feature.properties.Status = newStatus;
      feature.properties.StartTime = startTime;
      feature.properties.EndTime = endTime;
    }
    return feature;
  });
  
  return updatedData;
}

// Function to update map display
function updateMapDisplay(data) {
  // Remove existing layers
  if (geojsonLayer) {
    map.removeLayer(geojsonLayer);
    labelsLayer.clearLayers();
  }
  
  // Add updated districts to the map
  geojsonLayer = L.geoJSON(data, {
    style: feature => ({
      color: feature.properties.Status === 'outage' ? 'red' : 
             feature.properties.Status === 'powered' ? 'green' : 'gray',
      weight: 2,
      fillOpacity: 0.4
    }),
    onEachFeature: (feature, layer) => {
      // Add popups with district info
      layer.bindPopup(`
        <strong>District: </strong> ${feature.properties.NAME_2}<br>
        <strong>Est Population:</strong> ${feature.properties.PopEst || 'N/A'} <br>
        <strong>Power Status:</strong> ${feature.properties.Status || 'Unknown'}<br>
        <strong>Scheduled Outage Start Time:</strong> ${feature.properties.StartTime || 'N/A'}<br>
        <strong>Scheduled Outage End Time:</strong> ${feature.properties.EndTime || 'N/A'}<br>
        <button onclick="openStatusUpdateModal('${feature.properties.NAME_2}')">Update Status</button>
      `);

      // Add labels on each district
      const coordinates = layer.getBounds().getCenter();
      const label = L.marker(coordinates, {
        icon: L.divIcon({
          className: 'label-icon',
          html: `<div>${feature.properties.NAME_2}</div>`,
          iconSize: [60, 20]
        }),
        interactive: false
      });
      labelsLayer.addLayer(label);
    }
  }).addTo(map);
}

// Global function to open status update modal
window.openStatusUpdateModal = function(districtName) {
  const modal = document.getElementById('status-update-modal') || createStatusUpdateModal();
  
  // Populate the modal with district-specific information
  document.getElementById('district').value = districtName;
  
  // Find the current status of the district
  const district = currentData.features.find(f => f.properties.NAME_2 === districtName);
  if (district) {
    document.getElementById('status').value = district.properties.Status || 'other';
    document.getElementById('start-time').value = district.properties.StartTime || '';
    document.getElementById('end-time').value = district.properties.EndTime || '';
  }
  
  modal.style.display = 'block';
};

// Load the GeoJSON file
fetch('copperbelt_4326_final.geojson')
  .then(response => response.json())
  .then(data => {
    // Store the original data globally
    currentData = data;
    
    // Initial map display
    updateMapDisplay(data);
  })
  .catch(err => console.error('Error loading GeoJSON:', err));

// Control labels visibility based on zoom level
map.on('zoomend', function () {
  if (map.getZoom() >= 7) {
    map.addLayer(labelsLayer);
  } else {
    map.removeLayer(labelsLayer);
  }
});

// Add Legend to the bottom right of the map
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = `
    <h4>Power Status</h4>
    <div><i style="background: red; width: 15px; height: 15px; display: inline-block; margin-right: 5px;"></i> Outage</div>
    <div><i style="background: green; width: 15px; height: 15px; display: inline-block; margin-right: 5px;"></i> Powered</div>
    <div><i style="background: gray; width: 15px; height: 15px; display: inline-block; margin-right: 5px;"></i> Other</div>
  `;
  return div;
};

legend.addTo(map);