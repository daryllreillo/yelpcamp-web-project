// load from DOM element #campListJSON into mapData
let campListJSON = document.querySelector('#campListJSON');
campListJSON = JSON.parse(campListJSON.innerHTML);
const mapData = { type: 'FeatureCollection', crs: { type: 'name', properties: { name: 'campgrounds collection' } }, features: campListJSON };
// mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiaHNlZXlvIiwiYSI6ImNsZG12dnF5azA3eHgzd3FlZXh3bWQ5bGoifQ.u0kMd3gr3HlfcJhYnRcPdA';
let mapCenter = [79.415, 28.364];
if (campListJSON.length < 99) mapCenter = campListJSON[0]?.geometry.coordinates;
// map element from mapboxGL
const map = new mapboxgl.Map({
  container: 'mapbox',
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  style: 'mapbox://styles/mapbox/streets-v12',
  // center at north america coordinates
  center: mapCenter,
  zoom: 2,
});

map.on('load', () => {
  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.
  map.addSource('campgrounds', {
    type: 'geojson',
    // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
    // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
    data: mapData,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
  });

  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'campgrounds',
    filter: ['has', 'point_count'],
    paint: {
      // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      'circle-color': ['step', ['get', 'point_count'], '#16A085', 9, '#F1C40F', 29, '#F39C12', 49, '#D35400'],
      'circle-radius': ['step', ['get', 'point_count'], 14, 9, 19, 29, 26, 49, 31],
    },
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'campgrounds',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
  });

  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'campgrounds',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#2ECC71',
      'circle-radius': 10,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  });

  // inspect a cluster on click
  map.on('click', 'clusters', e => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('campgrounds').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom,
      });
    });
  });

  // When a click event occurs on a feature in
  // the unclustered-point layer, open a popup at
  // the location of the feature, with
  // description HTML from its properties.
  map.on('click', 'unclustered-point', e => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const id = e.features[0].properties.id;
    const title = e.features[0].properties.title;
    const locName = JSON.parse(e.features[0].properties.location).name;
    // const markup = e.features[0].properties.popupMarkup; // this doesn't translate well
    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`<a class="text-dark" href='/campgrounds/${id}/view'><strong>${title}</strong><br> ${locName} </a>`)
      .addTo(map);
  });

  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });
  // adds a control button to adjust map to full screen
  map.addControl(new mapboxgl.FullscreenControl());
  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl());
});
