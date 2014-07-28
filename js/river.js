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
          featureType: "road",
          elementType: "all",
          stylers: [
            { hue: "#aaaaaa" }
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
            { saturation: 90 }
          ]
        },
        {
          featureType: "landscape.natural",
          elementType: "all",
          styles: [
            { hue: "#B27800" },
            { saturation: 90 }
          ]
        }
      ]
    },

    riverKml: 'http://kevee.org/salinas-river/data/river.kml?v=5',

    overlayBounds : new google.maps.LatLngBounds(
      new google.maps.LatLng( 36.739173, -122.023154),
      new google.maps.LatLng( 35.986948, -120.871307)
    ),

    infoWindow : {},

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
      var that = this;
      this.map.data.loadGeoJson('data/points.json');
      this.map.data.addListener('mouseup', function(event) {
        that.infoWindow.setContent('<h3>' + event.feature.getProperty('title') + '</h3>' + '<p>' + event.feature.getProperty('description') + '</p>');
        var anchor = new google.maps.MVCObject();
				anchor.set("position", event.latLng);
				that.infoWindow.open(that.map, anchor);
      });
    },

    createMap : function() {
      this.map = new google.maps.Map($("#map-front").get(0), this.mapOptions);
      this.infoWindow = new google.maps.InfoWindow({
	      content: ""
	  	});
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
