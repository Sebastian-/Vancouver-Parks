var parkMapViewModel = function() {
    var self = this;

    self.map;
    self.parks = ko.observableArray();
    self.markers = [];
    self.idToMarker = Map

    // Load park data
    $.ajax({
        type: "GET",
        url: "static/parks_facilities.xml",
        dataType: "xml",
        success: function(xml) {
            var $parks = $(xml).find("Park");
            $parks.each(function(index, xmlPark) {
                self.parks.push(new Park(xmlPark));
            });
        }
    });

    self.initMap = function() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 49.255, lng: -123.130},
            zoom: 13
        });
        self.initMarkers();
    };

    self.initMarkers = function() {
        var bounds = new google.maps.LatLngBounds();
        ko.utils.arrayForEach(self.parks(), function(park) {
            var latLng = new google.maps.LatLng(park.lat, park.lng);
            bounds.extend(latLng);
            var marker = new google.maps.Marker({
                position: latLng,
                map: self.map
            });


        });
        map.fitBounds(bounds);
    };

}

var viewModel = new parkMapViewModel();
ko.applyBindings(viewModel);
