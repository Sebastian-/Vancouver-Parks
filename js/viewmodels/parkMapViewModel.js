var parkMapViewModel = function() {
    const self = this;

    self.googleMap;
    self.allParks = [];
    self.parkList = ko.observableArray();
    self.isParkListVisible = ko.observable(true);
    self.searchQuery = ko.observable("");

    // Maps autocomplete search terms {String} to resulting set of park IDs {Set(Integer)}
    self.searchMap = new Map();

    // Maps park IDs {Integer} to corresponding map marker {google.map.Marker}
    self.parkIdToMarker = new Map();

    $.ajax({
        type: "GET",
        url: "static/parks_facilities.xml",
        dataType: "xml",
        success: function(xmlResponse) {
            self.initListOfParks(xmlResponse);
        },
        complete: function() {
            self.initSearchMap();
            self.initSearchBox();
        }
    });

    self.initListOfParks = function(xmlParkData) {
        var $parks = $(xmlParkData).find("Park");
        $parks.each( function(index, xmlPark) {
            var park = new Park(xmlPark);
            self.allParks.push(park);
            self.parkList.push(park);
        });
        // A filler <li> for easier navigation of the last elements in list
        $("#parkList").append("<li class='lastListItem'></li>");
    };

    self.initSearchMap = function() {
        ko.utils.arrayForEach(self.allParks, function(park) {
            self.addToSearchMap(park.name, park.id);
            self.addToSearchMap(park.neighbourhood, park.id);
            ko.utils.arrayForEach(park.facilities, function(facility) {
                self.addToSearchMap(facility.type, park.id);
            });
            // A query of "" should return all parks
            self.addToSearchMap("", park.id);
        });
    };

    self.initSearchBox = function() {
        $("#searchBarInput").autocomplete({
            source: Array.from(self.searchMap.keys()),
            minLength: 2

        });
    };

    self.initGoogleMap = function() {
        self.setGoogleMap();
        self.initMarkers();
    };

    self.setGoogleMap = function() {
        self.googleMap = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 49.255, lng: -123.130},
            zoom: 13,
            mapTypeControl: false
        });
    }

    self.initMarkers = function() {
        var bounds = new google.maps.LatLngBounds();
        ko.utils.arrayForEach(self.allParks, function(park) {
            var latLng = new google.maps.LatLng(park.lat, park.lng);
            bounds.extend(latLng);
            var marker = new google.maps.Marker({
                position: latLng,
                map: self.googleMap
            });
            self.parkIdToMarker.set(park.id, marker);
        });
        self.googleMap.fitBounds(bounds);
    };

    self.updateMarkers = function() {
        self.unpinAllMarkers();
        self.pinParkListMarkers();
    };

    self.unpinAllMarkers = function() {
        for(let marker of self.parkIdToMarker.values()) {
            marker.setMap(null);
        }
    };

    self.pinParkListMarkers = function() {
        ko.utils.arrayForEach(self.parkList(), function(park) {
            let marker = self.parkIdToMarker.get(park.id);
            marker.setMap(self.googleMap);
        });
    }

    // Handler Functions
    self.toggleParkList = function() {
        self.isParkListVisible(!self.isParkListVisible());
    };

    self.searchParks = function() {
        if(!self.searchMap.has(self.searchQuery())) {
            self.displayNoResultParkList();
            return;
        }

        self.resetParkList();
        let result = self.searchMap.get(self.searchQuery());
        self.parkList.remove( function(park) {
            return !result.has(park.id);
        });
        self.updateMarkers();
    };

    self.displayNoResultParkList = function() {
        $("#parkList").empty();
        $("#parkList").append('<li class="noResultListItem">No Results Found</li>')
    }

    // Utility Functions
    self.addToSearchMap = function(key, parkID) {
        if(self.searchMap.has(key)) {
            self.searchMap.get(key).add(parkID);
        } else {
            self.searchMap.set(key, new Set([parkID]));
        }
    };

    self.resetParkList = function() {
        $("#parkList").empty();
        self.parkList.removeAll();
        for(let i = 0; i < self.allParks.length; i++) {
            self.parkList.push(self.allParks[i]);
        }
    };

}

var viewModel = new parkMapViewModel();
ko.applyBindings(viewModel);
