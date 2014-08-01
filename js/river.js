(function($, google) {

  var frontMap = {

    map : {},

    mapOverlay : {},

    currentMarker : false,

    icons : {
      default : {
        url: 'img/icons/marker.png',
        scaledSize: new google.maps.Size(30, 40),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(0, 15)
      },
      camera : {
        url: 'img/icons/camera.png',
        scaledSize: new google.maps.Size(30, 24),
        origin: new google.maps.Point(0,0),
        anchor: new google.maps.Point(12, 15)
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
            "featureType": "administrative",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "poi",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "road",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "water",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "transit",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "landscape",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "road.highway",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.local",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "water",
            "stylers": [
                {
                    "color": "#5f94ff"
                },
                {
                    "lightness": 26
                },
                {
                    "gamma": 5.86
                }
            ]
        },
        {},
        {
            "featureType": "road.highway",
            "stylers": [
                {
                    "weight": 0.6
                },
                {
                    "saturation": -85
                },
                {
                    "lightness": 61
                }
            ]
        },
        {
            "featureType": "road"
        },
        {},
        {
            "featureType": "landscape",
            "stylers": [
                {
                    "hue": "#0066ff"
                },
                {
                    "saturation": 74
                },
                {
                    "lightness": 100
                }
            ]
        }
    ]
    },

    points : {},

    riverKml: 'http://kevee.org/salinas-river/data/river.kml?v=13',

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
              that.setMarker(marker);
              var $link = $('<a href="#modal">');
              var $image = $('<img>').attr('src', 'img/' + feature.properties.photo);
              $('.description-title').html(feature.properties.title);
              $('.description-body').html($link.append($image)).append(feature.properties.description);

              $image.on('click', function() {
                $('#modal .modal-title').html(feature.properties.title);
                $('#modal .modal-body').html($image.clone());
                $('#modal').modal();
              });
            });
          }
          else {
            google.maps.event.addListener(marker, 'click', function() {
              var $image = $('<img>').attr('src', 'img/' + feature.properties.photo);
              $('.description-title').html(feature.properties.title);
              $('.description-body').html(feature.properties.description);
              that.setMarker(marker);
            });
          }
        });
      });
    },

    setMarker : function(marker) {
      this.map.setCenter(marker.getPosition());
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
        if($(window).width() > 750) {
          $('#description, #full-photo').css('height', $(window).height() + 'px');
        }
        else {
          $('#description, #full-photo').css('height', 'auto');
        }
      });
      $(window).trigger('resize');
    }
  };

  $(document).ready(function() {
    if($('#map-front').length) {
      frontMap.init();
    }
    if($('#description').hasClass('front')) {
      var originalHeight = $('#description').height();
      $('#description .closer').hide();
      if($(window).width() <= 750) {
        $('#description .slider-down').show();
        $('#description').animate({
            height: $(window).height() * .8
        }, 1000);
        $('#map-front, #description .slider-down').on('click', function() {
          $('#description').removeClass('full-photo');
          $('#description .slider-down').remove();
          $('#description .closer').show();
          $('#description').animate({
              height: originalHeight
          }, 1000);
        });
        return;
      }
      var originalWidth = $('#description').css('width');
      $('#description').animate({
          width: '80%'
      }, 1000);
      $('#map-front, #description .slider').on('click', function() {
        $('#description').removeClass('full-photo');
        $('#description .slider').remove();
        $('#description .closer').show();
        $('#description').animate({
            width: originalWidth
        }, 1000);
      });
    }
  });
})(jQuery, google);
