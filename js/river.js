(function($, google) {

  var frontMap = {

    map : {},

    mapOverlay : {},

    mapOptions : {
      center: new google.maps.LatLng(36.268597, -121.213735),
      zoom: 9,
      disableDefaultUI: true,
      streetViewControl: true,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      styles: [
        {
          featureType: "all",
          stylers: [
            { saturation: -80 }
          ]
        },{
          featureType: "road.arterial",
          elementType: "geometry",
          stylers: [
            { hue: "#00ffee" },
            { saturation: 50 }
          ]
        },{
          featureType: "poi.business",
          elementType: "labels",
          stylers: [
            { visibility: "off" }
          ]
        },
        {
          featureType: "water",
          elementType: "all",
          styles: [
            { hue: "#4d90fe" },
            { saturation: 50 }
          ]
        },
        {
          featureType: "landscape.natural",
          elementType: "all",
          styles: [
            { hue: "#B27800" },
            { saturation: 50 }
          ]
        }
      ]
    },

    riverKml: 'http://kevee.org/salinas-river/data/river.kml',

    overlayBounds : new google.maps.LatLngBounds(
      new google.maps.LatLng( 36.739173, -122.023154),
      new google.maps.LatLng( 35.986948, -120.871307)
    ),

    init : function() {
      this.resize();
      this.createMap();
      this.addOverlay();
      this.loadPoints();
    },

    addOverlay : function() {
      this.mapOverlay = new google.maps.GroundOverlay(
      'img/overlay.png',
          this.overlayBounds);
      this.mapOverlay.setMap(this.map);
      var riverLayer = new google.maps.KmlLayer({
        url: this.riverKml
      });
      riverLayer.setMap(this.map);
    },

    loadPoints : function() {
      this.map.data.loadGeoJson('data/points.json');
      this.map.data.addListener('mouseup', function(event) {
        $('#description h1').html(event.feature.getProperty('title'));
        $('#description p').html(event.feature.getProperty('description'));
      });
    },

    createMap : function() {
      this.map = new google.maps.Map($("#map-front").get(0), this.mapOptions);
    },

    resize: function() {
      $(window).on('resize', function() {
        $('#map-front').css('width', $(window).width() + 'px')
                       .css('height', $(window).height() + 'px');
      });
      $(window).trigger('resize');
    }
  };

  $(document).ready(function() {
    if($('#map-front').length) {
      frontMap.init();
    }
  });
})(jQuery, google);
