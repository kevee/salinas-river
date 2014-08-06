(function($, google, Handlebars) {

  var prismicEndpoint = 'https://salinas-river.prismic.io/api';
  var currentRef = 'U-GebjIAAIViaLlT';

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
        api.form('everything').ref(currentRef).query('[[:d = at(document.type, "place")]]').submit(function(error, documents) {
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
              that.slideOutDescription();
            });

            pointSidebar.push({
              id : this.id,
              name: data['place.name'].value,
              teaser: data['place.shortDescription'].value,
            });
            var source   = $("#points-template").html();
            var template = Handlebars.compile(source);
            $('#description .point-wrapper').html(template({points : pointSidebar }));
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
      window.location.href = '#point-page/' + id;
      $page = $('<div id="page" class="page">');
      var point = {};
      $.each(this.points, function() {
        if(this.id == id) {
          var source   = $("#point-page-template").html();
          var template = Handlebars.compile(source);
          point = {
            name : this.fragments['place.name'].value,
            content : (typeof this.getStructuredText('place.description') !== 'undefined') ? this.getStructuredText('place.description').asHtml() : '',
            sound : this.getText('place.soundcloud'),
            showSlideshow: false,
            slideshow: []
          }
          if(typeof this.fragments['place.slideshow_1'] !== 'undefined') {
            point.showSlideshow = true;
            for(var i = 1; i < 11; i++) {
              if(typeof this.fragments['place.slideshow_' + i] !== 'undefined') {
                var image = this.fragments['place.slideshow_' + i];
                point.slideshow.push({
                  image: image.value.views.medium.url,
                  caption: image.value.main.alt,
                  number: i - 1
                });
              }
            }
          }
          $page.html(template(point));
        }
      });
      $('body').prepend($page);
      if(point.showSlideshow) {
        $('[data-slide-to=0], #carousel .item:first').addClass('active');
      }
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
      $(window).trigger('resize');
    },

    createMap : function() {
      this.map = new google.maps.Map($("#map-front").get(0), this.mapOptions);
      this.infoWindow = new google.maps.InfoWindow({
	      content: ""
	  	});
    },

    slideOutDescription: function() {
      if(!$('#description').hasClass('collapsible')) {
        return;
      }
      $('#description').animate({
        left: '0px'
      },
      300,
      function() {
        $('#descriptoin').addClass('expanded');
      })
    },

    resize: function() {
      var that = this;
      $(window).on('resize', function() {
        $('#map-front, .basic-page-wrapper').css('width', $(window).width() + 'px')
                       .css('height', ($(window).height() - $('nav.navbar').height()) + 'px');
        $('.map').css('width')
        $('#description, #full-photo').css('height', ($(window).height() - $('nav.navbar').height()) + 'px');
        if($(window).width() < 751) {
          $('#description').addClass('collapsible');
          $('#description:not(#description.expanded)').css('left', (($(window).width() - 30) * -1) + 'px');
          $('#description.collapsed').on('click', that.slideOutDescription);
        }
        else {
          $('#page').css('width', ($(window).width() - $('#description').width()) + 'px');
        }
      });
      $(window).trigger('resize');
    },

    center : function(latLng) {
      this.map.setCenter(latLng);
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
        api.form('everything').ref(currentRef).query('[[:d = at(document.id, "' + that.id +'")]]').submit(function(error, document) {
          var doc = document.results[0];
          var source   = $("#page-template").html();
          var template = Handlebars.compile(source);
          $('#page-wrapper').html(template({
            content : doc.getStructuredText('page.description').asHtml(),
            title : doc.fragments['page.name'].value,
            coverPhoto: doc.getImage('page.headingImage').main.url
          }));
          $(window).trigger('resize');
        });
      });
    }
  };

  var frontPage = {

    id : 'U-G0GTIAADQAaOTL',

    page : { },

    init : function() {
      var that = this;
      Prismic.Api('https://salinas-river.prismic.io/api', function(error, api) {
        api.form('everything').ref(currentRef).query('[[:d = at(document.id, "' + that.id +'")]]').submit(function(error, document) {
          var doc = document.results[0];
          console.log(doc);
          $('#cover-photo h1').html(doc.fragments['page.name'].value);
          $('#cover-photo .content').html(doc.getStructuredText('page.description').asHtml());
          $(window).trigger('resize');
        });
      });
    }
  };


  $(document).ready(function() {
    $.getJSON('https://salinas-river.prismic.io/api', function(data) {
      currentRef = data.refs[0].ref;
      if($('#map-front').length) {
        frontMap.init();
      }
      if($('#contact').length) {
        contactForm.init();
      }
      if($('#page-template').length) {
        regularPage.init();
      }
      if($('#cover-photo.home').length) {
        frontPage.init();
      }

      $('.cover-photo').css('height', ($(window).height() * .5) + 'px');
      $(window).on('resize', function() {
        $('.cover-photo').css('height', ($(window).height() * .5) + 'px');
        $('#cover-photo').css('width', $(window).width() + 'px')
                         .css('height', ($(window).height() - $('.navbar').height()) + 'px');

      });
      $(window).trigger('resize');
      $('#description .slide-back').on('click', function() {
        $('#description').removeClass('expanded');
        $('#description').animate({
          left: (($(window).width() - 30) * -1) + 'px'
        }, 300,
        function() {
          $('#description').addClass('collapsed');
        });
      });
    });
  });
})(jQuery, google, Handlebars);
