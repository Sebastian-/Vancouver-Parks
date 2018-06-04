var parkMapViewModel = function() {
    var self = this;

    self.googleMap;
    self.parks = ko.observableArray();
    self.isParkListVisible = ko.observable(true);
    self.searchMap = new Map();
    /* TODO map park id to markers to manage showing and hiding markers
    self.idToMarker = Map
    */

    $.ajax({
        type: "GET",
        url: "static/parks_facilities.xml",
        dataType: "xml",
        success: function(xmlResponse) {
            // Initialize parks observable array
            var $parks = $(xmlResponse).find("Park");
            $parks.each(function(index, xmlPark) {
                var park = new Park(xmlPark);
                self.parks.push(park);
            });
            // A filler <li> for easier navigation of the last elements in list
            $("#parkList").append("<li class='lastListItem'></li>");
        },
        complete: function() {
            // Initialize searchMap
            self.parks().forEach(function(park) {
                self.addToSearchMap(park.name, park.id);
                self.addToSearchMap(park.neighbourhood, park.id);
                park.facilities.forEach(function(facility) {
                    self.addToSearchMap(facility.type, park.id);
                });
            });
            self.initSearchBox();
        }
    });

    self.initSearchBox = function() {
        $("#searchBarInput").autocomplete({
            source: Array.from(self.searchMap.keys())
        });
    };

    self.initGoogleMap = function() {
        self.googleMap = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 49.255, lng: -123.130},
            zoom: 13,
            mapTypeControl: false
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
                map: self.googleMap
            });
        });
        self.googleMap.fitBounds(bounds);
    };

    self.toggleParkList = function() {
        self.isParkListVisible(!self.isParkListVisible());
    };

    // Utility functions
    self.addToSearchMap = function(key, parkID) {
        if(self.searchMap.has(key)) {
            self.searchMap.get(key).add(parkID);
        } else {
            self.searchMap.set(key, new Set(parkID));
        }
    };

}

var viewModel = new parkMapViewModel();
ko.applyBindings(viewModel);
