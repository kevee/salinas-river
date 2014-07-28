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
          featureType: "landscape",
          stylers: [
            { hue: "#A8CC18" },
            { saturation: -60 }
          ]
        },{
          featureType: "road",
          elementType: "all",
          stylers: [
            { hue: "#aaaaaa" },
            { saturation: -70 }
          ]
        },{
          featureType: "poi",
          elementType: "labels",
          stylers: [
            { visibility: "off" }
          ]
        },{
          featureType: "administrative.locality",
          elementType: "geometry",
          stylers: [
            { hue: "#FF6250" }
          ]
        }
      ]
    },

    riverKml: 'http://kevee.org/salinas-river/data/river.kml?v=8',

    overlayBounds : new google.maps.LatLngBounds(
      new google.maps.LatLng( 36.739173, -122.023154),
      new google.maps.LatLng( 35.986948, -120.871307)
    ),

    infoWindow : {},

    tourPoints : {},

    currentTourPoint : 0,

    init : function() {
      var that = this;
      this.resize();
      this.createMap();
      this.addOverlay(function() {
        if($('#map-front').hasClass('tour')) {
          that.addTour();
        }
        else {
          that.loadPoints();
        }
      });
    },

    addTour : function() {
      var that = this;
      $.getJSON('data/tour.json', function(data) {
        that.tourPoints = data.features;
        that.currentTourPoint = 0;
        if(window.location.hash.length) {
          that.currentTourPoint = parseInt(window.location.hash.replace('#', ''));
        }
        that.showCurrentPoint();
        that.updateMoveButtons();
      });
      $('.move').on('click', function(event) {
        event.preventDefault();
        if($(this).hasClass('disabled')) {
          return;
        }
        if($(this).data('direction') == 'forward') {
          that.currentTourPoint++;
        }
        else {
          that.currentTourPoint--;
        }
        window.location.hash = '#' + that.currentTourPoint;
        that.showCurrentPoint();
        that.updateMoveButtons();
      });
    },

    updateMoveButtons : function() {
      if(typeof this.tourPoints[this.currentTourPoint + 1] === 'undefined') {
        $('#next').addClass('disabled');
      }
      else {
        $('#next').removeClass('disabled');
      }
      if(typeof this.tourPoints[this.currentTourPoint - 1] === 'undefined') {
        $('#previous').addClass('disabled');
      }
      else {
        $('#previous').removeClass('disabled');
      }
    },

    showCurrentPoint : function() {
      var point = this.tourPoints[this.currentTourPoint],
          latLng = new google.maps.LatLng( point.geometry.coordinates[1], point.geometry.coordinates[0] );
      this.map.panTo(latLng);
      this.map.setZoom(11);
      this.infoWindow.setContent('<h3>' + point.properties.title + '</h3>' + '<p>' + point.properties.description + '</p>');
      var anchor = new google.maps.MVCObject();
      anchor.set("position", latLng);
      this.infoWindow.open(this.map, anchor);
    },

    addOverlay : function(callback) {
      this.mapOverlay = new google.maps.GroundOverlay(
      'img/overlay.png',
          this.overlayBounds);
      this.mapOverlay.setMap(this.map);
      var riverLayer = new google.maps.KmlLayer({
        url: this.riverKml
      });
      riverLayer.addListener('status_changed', callback);
      riverLayer.setMap(this.map);
      this.map.setZoom(this.mapOptions.zoom);
      this.map.setCenter(this.mapOptions.center);
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
