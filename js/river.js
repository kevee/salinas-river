(function($, google) {

  var frontMap = {

    map : {},

    mapOverlay : {},

    icons : {
      default : {
        url: 'img/icons/marker.png',
        scaledSize: new google.maps.Size(30, 40),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(0, 15)
      },
      camera : {
        url: 'img/icons/camera.png',
        scaledSize: new google.maps.Size(48, 40),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(24, 20)
      }
    },

    mapOptions : {
      center: new google.maps.LatLng(36.268597, -121.213735),
      zoom: 9,
      disableDefaultUI: true,
      zoomControl: true,
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

    points : {},

    riverKml: 'http://kevee.org/salinas-river/data/river.kml?v=11',

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
      this.bindClose();
      this.addOverlay(function() {
        if($('#map-front').hasClass('tour')) {
          that.addTour();
        }
        if($('#map-front').hasClass('front')) {
          that.loadPoints();
        }
      });
    },

    bindClose : function() {
      $('.closer').on('click', function() {
        $(this).parents('.closeable').hide();
        $('.tempeh-ruben').show();
      });
      $('.tempeh-ruben').on('click', function() {
        $(this).hide();
        $('.closeable').show();
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
      this.map.setZoom(13);
      this.infoWindow.setContent('<h3>' + point.properties.title + '</h3>' + '<p>' + point.properties.description + '</p>');
      var anchor = new google.maps.MVCObject();
      anchor.set("position", latLng);
      this.infoWindow.open(this.map, anchor);
    },

    addOverlay : function(callback) {
      var that = this;
      this.mapOverlay = new google.maps.GroundOverlay(
      'img/overlay.png',
          this.overlayBounds);
      this.mapOverlay.setMap(this.map);
      var riverLayer = new google.maps.KmlLayer({
        url: this.riverKml
      });
      riverLayer.addListener('status_changed', function(thing) {
        if(typeof callback !== 'undefined') {
          callback();
        }
        //that.map.setZoom(this.mapOptions.zoom);
        //that.map.setCenter(this.mapOptions.center);
      });
      riverLayer.setMap(this.map);
    },

    loadPoints : function() {
      var that = this;
      $.getJSON('data/points.json', function(data) {
        that.points = data.features;
        $.each(that.points, function(index, feature) {
          var latLng = new google.maps.LatLng(this.geometry.coordinates[1], this.geometry.coordinates[0]);
          var icon = (typeof this.properties.icon !== 'undefined') ? this.properties.icon : 'default';
          var marker = new google.maps.Marker({
              position: latLng,
              map: that.map,
              title: this.properties.title,
              icon: that.icons[icon]
          });
          if(typeof feature.properties.photo !== 'undefined') {
            google.maps.event.addListener(marker, 'click', function() {
              var $image = $('<img>').attr('src', 'img/' + feature.properties.photo);
              $('#modal .modal-title').html(feature.properties.title);
              $('#modal .modal-body').html($image);
              $('#modal').modal();
            });
          }
          else {
            google.maps.event.addListener(marker, 'click', function() {
              that.infoWindow.setContent('<h4>' + feature.properties.title + '</h4>' + '<p>' + feature.properties.description + '</p>');
              that.infoWindow.open(that.map, marker);
            });
          }
        });
      });
      /*this.map.data.addListener('mouseup', function(event) {
        if(event.feature.getProperty('photo') !== 'undefined') {

        }
        else {
          var anchor = new google.maps.MVCObject();
  				anchor.set("position", event.latLng);
  				that.infoWindow.setOptions({
            pixelOffset: new google.maps.Size(0, -40)
          });
          that.infoWindow.open(that.map, anchor);
        }
      });*/
    },

    createMap : function() {
      this.map = new google.maps.Map($("#map-front").get(0), this.mapOptions);
      this.infoWindow = new google.maps.InfoWindow({
	      content: ""
	  	});
    },

    resize: function() {
      $(window).on('resize', function() {
        $('#map-front, #personnel').css('width', $(window).width() + 'px')
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
