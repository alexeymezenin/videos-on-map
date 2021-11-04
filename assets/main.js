const mapEl = document.getElementById('map');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const fromFormat = 'EPSG:3857';
const toFormat = 'EPSG:4326';

const iconStyle = createIconStyle();
const map = createMap();
const popupOverlay = createPopupOverlay();

let currentFeatureLayer;

map.addOverlay(popupOverlay);

registerMapEvents();


function createIconStyle() {
  return new ol.style.Style({
    image: new ol.style.Icon(({
      scale: 0.8,
      rotateWithView: false,
      anchor: [0.5, 1],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      opacity: 1,
      src: '/assets/marker.png'
    })),
    zIndex: 5
  });
}

function createMap() {
  return new ol.Map({
    controls: ol.control.defaults({attribution: false}).extend([ new ol.control.Attribution({ collapsible: false }) ]),
    layers: [
        new ol.layer.Tile({ source: new ol.source.OSM() })
    ],
    target: 'map',
    view: new ol.View({
        center: ol.proj.fromLonLat([parseFloat(mapEl.dataset.lng), parseFloat(mapEl.dataset.lat)]),
        zoom: parseInt(mapEl.dataset.zoom),
        minZoom: 4,
        maxZoom: 15
    })
  });
}

function createPopupOverlay() {
  return new ol.Overlay({
    element: document.getElementById('popup'),
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
  });
}

function registerMapEvents() {
  map.on('moveend', loadMarkers);

  map.on('singleclick', function (event) {
    if (map.hasFeatureAtPixel(event.pixel) === true) {
      let coordinate = event.coordinate;

      map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
        content.innerHTML = '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + feature.get('video') + '" frameborder="0" allow="autoplay;" allowFullScreen allowfullscreen></iframe>';
      })

      popupOverlay.setPosition(coordinate);
    } else {
      popupOverlay.setPosition(undefined);

      closer.blur();

      content.innerHTML = '';
    }
  });
}

function loadMarkers() {
  clearMarkers()

  let { topLeft, bottomRight } = getMapBounds();
  
  fetch('/api/videos?llat=' + bottomRight[1] + '&llng=' + topLeft[0] + '&rlat=' + topLeft[1] + '&rlng=' + bottomRight[0])
    .then(response => response.json()).then(json => putMarkersOnMap(json))
    .catch(error => {})
}

function getMapBounds() {
  let currentExtent = map.getView().calculateExtent(map.getSize());
  let topLeft = ol.proj.transform(ol.extent.getTopLeft(currentExtent), fromFormat, toFormat);
  let bottomRight = ol.proj.transform(ol.extent.getBottomRight(currentExtent), fromFormat, toFormat);

  return { topLeft, bottomRight }
}

function putMarkersOnMap(markersData) {
  let video;
  let features = [];
  let currentFeatureLayer;

  if (!markersData.data) {
    return;
  }

  for (video of markersData.data) {  
    features.push(putOneMarkerOnMap(video));
  }

  currentFeatureLayer = new ol.layer.Vector({
    source: new ol.source.Vector({ features })
  });
  
  map.addLayer(currentFeatureLayer);
}

function putOneMarkerOnMap(video) {
  let feature = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([video.lng, video.lat])) 
  })
  
  feature.set('video', video.youtube_id)
  
  feature.setStyle(iconStyle)

  return feature;
}

function clearMarkers() {
  map.removeLayer(currentFeatureLayer)
}
