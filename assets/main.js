function initMap() {
  window.markers = []
  window.infowindows = []
  window.markerWasNotJustClicked = true;

  mapEl = document.getElementById('map');

  window.map = new google.maps.Map(document.getElementById("map"), {
    zoom: parseInt(mapEl.dataset.zoom),
    center: {
      lat: parseFloat(mapEl.dataset.lat),
      lng: parseFloat(mapEl.dataset.lng)
    },
    minZoom: 4,
    maxZoom: 15
  });

  window.map.addListener("idle", () => {
    if (window.markerWasNotJustClicked) {
      loadMarkers();

      closeInfoWindow();
    }
    
    window.markerWasNotJustClicked = true;
  });
}

function loadMarkers() {
  clearMarkers()

  let bounds = window.map.getBounds();

  if (!bounds) {
    return
  }

  fetch('/api/videos?llat=' + window.map.getBounds().getSouthWest().lat() + '&llng=' + window.map.getBounds().getSouthWest().lng() + '&rlat=' + window.map.getBounds().getNorthEast().lat() + '&rlng=' + window.map.getBounds().getNorthEast().lng())
    .then(response => response.json()).then(json => putMarkersOnMap(json))
    .catch(error => {})
}

function putMarkersOnMap(markersData) {
  let video;

  if (!markersData.data) {
    return;
  }

  for (video of markersData.data) {  
    putOneMarkerOnMap(video);
  }
}

function putOneMarkerOnMap(video) {
  let marker;

  marker = new google.maps.Marker({
    position: {lat: Number(video.lat), lng: Number(video.lng)},
    map: window.map
  });

  window.markers.push(marker)

  addInfoWindowForMarker(marker, '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + video.youtube_id + '" frameborder="0" allow="autoplay;" allowFullScreen></iframe>');
}

function addInfoWindowForMarker(marker, content) {
  let infowindow = new google.maps.InfoWindow();

  window.infowindows.push(infowindow);

  google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){ 
    return function() {
      window.markerWasNotJustClicked = false;

      window.infowindows.forEach((infowindow) => {
        infowindow.close()
      });

      infowindow.setContent(content);
      
      infowindow.open(window.map,marker);
    };
  })(marker,content,infowindow));
}

function clearMarkers() {
  window.markers.forEach(function(marker) {
    marker.setMap(null);
  });
  
  window.markers = [];
}

function closeInfoWindow() {
  if (window.infowindow) {
    window.infowindow.close();
  }
}
