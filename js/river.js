(function($, google, Handlebars) {

  var prismicEndpoint = 'https://salinas-river.prismic.io/api';
  var currentRef = '';

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
      this.addOverlay(function() {
        that.loadPoints();
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
      Prismic.Api('https://salinas-river.prismic.io/api', function(error, api) {
        api.form('everything').ref('U-EpiTIAAC0AZ84Y').query('[[:d = at(document.type, "place")]]').submit(function(error, documents) {
          that.points = documents.results;
          var pointSidebar = [];
          $.each(that.points, function() {
            var data = this.fragments;
            var id = this.id
            var latLng = new google.maps.LatLng(data['place.position'].value.latitude, data['place.position'].value.longitude);
            var icon = (typeof data['place.image'] !== 'undefined') ? 'camera' : 'default';
            var marker = new google.maps.Marker({
                position: latLng,
                map: that.map,
                icon: that.icons[icon]
            });
            google.maps.event.addListener(marker, 'click', function() {
              $('ul.points [data-id='+ id +']').trigger('click');
            });

            pointSidebar.push({
              id : this.id,
              name: data['place.name'].value,
              teaser: data['place.shortDescription'].value,
            });
            var source   = $("#points-template").html();
            var template = Handlebars.compile(source);
            $('#description').html(template({points : pointSidebar }));
            $('ul.points a').on('click', function(event) {
              $('.page').remove();
              if($(this).parents('.current').length) {
                event.preventDefault();
                that.openPointPage($(this).data('id'));
              }
              that.centerOnPoint($(this).data('id'));
              $('#cover-photo').remove();
            });
            if(window.location.hash.search('point/') > -1) {
              var id = window.location.hash.replace('#point/', '');
              $('ul.points [data-id=' + id + ']').trigger('click');
            }
          });
        });
      });
    },

    openPointPage : function(id) {
      window.location.href = '#point/page/' + id;
      $page = $('<div id="page" class="page">');
      $.each(this.points, function() {
        if(this.id == id) {
          var source   = $("#point-page-template").html();
          var template = Handlebars.compile(source);
          var point = {
            name : this.fragments['place.name'].value,
            content : (typeof this.getStructuredText('place.description') !== 'undefined') ? this.getStructuredText('place.description').asHtml() : '',
            sound : this.getText('place.soundcloud')
          }
          $page.html(template(point));
        }
      });
      $('body').append($page);
      $('.close-page').on('click', function() {
        window.location.href = '#point/' + id;
        $('.page').remove();
      });
    },

    centerOnPoint : function(id) {
      var that = this;
      $.each(this.points, function() {
        if(this.id == id) {
          var data = this.fragments;
          var latLng = new google.maps.LatLng(data['place.position'].value.latitude, data['place.position'].value.longitude);
          that.center(latLng);
        }
      });
      $('ul.points .current .open').remove();
      $('ul.points .current').removeClass('current');
      $('ul.points [data-id=' + id + ']').parents('li').addClass('current').append('<span class="glyphicon glyphicon-chevron-right open"></span>');
    },

    createMap : function() {
      this.map = new google.maps.Map($("#map-front").get(0), this.mapOptions);
      this.infoWindow = new google.maps.InfoWindow({
	      content: ""
	  	});
    },

    resize: function() {
      $(window).on('resize', function() {

        $('#map-front, .basic-page-wrapper').css('width', $(window).width() + 'px')
                       .css('height', ($(window).height() - $('nav.navbar').height()) + 'px');
        $('.map').css('width')
        $('#description, #full-photo').css('height', ($(window).height() - $('nav.navbar').height()) + 'px');
        $('#cover-photo').css('width', ($(window).width() - $('#description').width()) + 'px')
        .css('height', ($(window).height() * .5) + 'px');
      });
      $(window).trigger('resize');
    },

    center : function(latLng) {
      var offsetx = $('#description').width() - 100;
      var offsety = 0;
      var point1 = this.map.getProjection().fromLatLngToPoint(
          (latLng instanceof google.maps.LatLng) ? latLng : this.map.getCenter()
      );
      var point2 = new google.maps.Point(
          ( (typeof(offsetx) == 'number' ? offsetx : 0) / Math.pow(2, this.map.getZoom()) ) || 0,
          ( (typeof(offsety) == 'number' ? offsety : 0) / Math.pow(2, this.map.getZoom()) ) || 0
      );
      this.map.setCenter(this.map.getProjection().fromPointToLatLng(new google.maps.Point(
          point1.x - point2.x,
          point1.y + point2.y
      )));
    }
  };

  var contactForm = {
    init : function() {
      $('#contact').on('submit', this.sendMail);
    },

    sendMail: function() {
      $.ajax({
        type: "POST",
        url: "https://mandrillapp.com/api/1.0/messages/send.json",
        data: {
          'key': '7gpqkvVsRPh7IFYy0XiAZw',
          'message': {
            'from_email': $('#email').val(),
            'to': [
                {
                  'email': 'kevin@csumb.edu',
                  'type': 'to'
                }
              ],
            'autotext': 'true',
            'subject': 'Contact form',
            'html': $('#message').val()
          }
        }
       }).done(function(response) {
         console.log(response); // if you're into that sorta thing
       });
    }
  };

  var regularPage = {

    id : '',

    page : { },

    init : function() {
      var that = this;
      this.id = window.location.hash.replace('#', '');
      Prismic.Api('https://salinas-river.prismic.io/api', function(error, api) {
        api.form('everything').ref('U-EpiTIAAC0AZ84Y').query('[[:d = at(document.id, "' + that.id +'")]]').submit(function(error, document) {
          var doc = document.results[0];
          var source   = $("#page-template").html();
          var template = Handlebars.compile(source);
          console.log(doc);
          $('#page-wrapper').html(template({
            content : doc.getStructuredText('page.description').asHtml(),
            title : doc.fragments['page.name'].value,
            coverPhoto: doc.getImage('page.headingImage').main.url
          }));
          $(window).trigger('resize');
        });
      });
    }
  }

  $(document).ready(function() {
    if($('#map-front').length) {
      frontMap.init();
    }
    if($('#contact').length) {
      contactForm.init();
    }
    if($('#page-template').length) {
      regularPage.init();
    }
    $('#cover-photo .close').on('click', function(event) {
      event.preventDefault();
      $('#cover-photo').animate({
        height: '0px',
      }, 500, function() {
        $('#cover-photo').remove();
      });
    });
    $('.cover-photo').css('height', ($(window).height() * .5) + 'px');
    $(window).on('resize', function() {
      $('.cover-photo').css('height', ($(window).height() * .5) + 'px');
    });
    $(window).trigger('resize');
  });
})(jQuery, google, Handlebars);
