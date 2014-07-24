(function($, google) {

  var frontMap = {

    map : {},

    mapOverlay : {},

    mapOptions : {
      center: new google.maps.LatLng(36.268597, -121.213735),
      zoom: 9,
      disableDefaultUI: true,
      streetViewControl: true,
      mapTypeId: google.maps.MapTypeId.TERRAIN
    },

    overlayBounds : new google.maps.LatLngBounds(
      new google.maps.LatLng( 36.739173, -122.023154),
      new google.maps.LatLng( 35.986948, -120.871307)
    ),

    init : function() {
      this.resize();
      this.createMap();
      this.addOverlay();
      this.loadPoints();
      this.addArt();
    },

    addArt : function() {
      var that = this;
      $.getJSON('data/art.json', function(art) {
        $.each(art.features, function(index, feature) {
          var latLng = new google.maps.LatLng(feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
          );
          var icon = {
            size: new google.maps.Size(80, 80),
            url: 'img/markers/' + feature.properties.marker
          }
          var marker = new google.maps.Marker({
            position: latLng,
            map: that.map,
            icon: icon
          });
          google.maps.event.addListener(marker, 'click', function() {
            $('#description').html('<img class="art" src="img/art/' + feature.properties.img + '"/>');
          });
        });
      });
    },

    addOverlay : function() {
      this.mapOverlay = new google.maps.GroundOverlay(
      'img/overlay.png',
          this.overlayBounds);
      this.mapOverlay.setMap(this.map);
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
