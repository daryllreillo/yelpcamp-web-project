let campJSON = document.querySelector('#campJSON');
campJSON = JSON.parse(campJSON.innerHTML);
let defCoordinates = campJSON.location.geometry.coordinates;
mapboxgl.accessToken = 'pk.eyJ1IjoiaHNlZXlvIiwiYSI6ImNsZG12dnF5azA3eHgzd3FlZXh3bWQ5bGoifQ.u0kMd3gr3HlfcJhYnRcPdA';
const map = new mapboxgl.Map({
  container: 'mapbox', // container ID
  style: 'mapbox://styles/mapbox/streets-v12', // style URL
  center: defCoordinates, // starting position [lng, lat]
  zoom: 8, // starting zoom
});
// adds a marker on the map
const marker1 = new mapboxgl.Marker({ color: 'red' }).setLngLat(defCoordinates).addTo(map);
// adds a control button to adjust map to full screen
map.addControl(new mapboxgl.FullscreenControl());
// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());
// adds the popup tooltip on the map
const popup = new mapboxgl.Popup({ offset: 35 }).setHTML(`<strong>Campground: ${campJSON.title}</strong><br>${campJSON.location.name}`);
const el = document.createElement('div');
el.id = 'marker';
new mapboxgl.Marker(el)
  .setLngLat(defCoordinates)
  .setPopup(popup) // sets a popup on this marker
  .addTo(map);
