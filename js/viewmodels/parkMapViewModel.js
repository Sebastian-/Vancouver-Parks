var parkMapViewModel = function() {
    const self = this;

    self.googleMap;
    self.allParks = [];
    self.parkList = ko.observableArray();
    self.isParkListVisible = ko.observable(true);
    self.searchQuery = ko.observable("");
    self.searchMap = new Map();
    self.parkIdToMarker = new Map();

    // TODO pull out the initialization functions here and give them names
    $.ajax({
        type: "GET",
        url: "static/parks_facilities.xml",
        dataType: "xml",
        success: function(xmlResponse) {
            var $parks = $(xmlResponse).find("Park");
            $parks.each(function(index, xmlPark) {
                var park = new Park(xmlPark);
                self.allParks.push(park);
                self.parkList.push(park);
            });
            // A filler <li> for easier navigation of the last elements in list
            $("#parkList").append("<li class='lastListItem'></li>");
        },
        complete: function() {
            // Initialize searchMap
            // TODO use ko.utils.arrayForEach instead
            self.allParks.forEach(function(park) {
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
            source: Array.from(self.searchMap.keys()),
            minLength: 2

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
        // TODO update bounds/zoom map appropriately
        self.unpinAllMarkers();
        ko.utils.arrayForEach(self.parkList(), function(park) {
            let marker = self.parkIdToMarker.get(park.id);
            marker.setMap(self.googleMap);
        });
    };

    self.unpinAllMarkers = function() {
        for(let marker of self.parkIdToMarker.values()) {
            marker.setMap(null);
        }
    };

    // Handler Functions
    self.toggleParkList = function() {
        self.isParkListVisible(!self.isParkListVisible());
    };

    self.searchParks = function(formElement) {
        // TODO handle case where query returns no results or same query is passed again
        let query = self.searchQuery();
        console.log(query);
        if(query === "") {
            self.resetParkList();
        } else {
            self.resetParkList();
            let result = self.searchMap.get(query);
            self.parkList.remove( function(park) {
                return !result.has(park.id);
            });
            self.updateMarkers();
        }
    };

    // Utility Functions
    self.addToSearchMap = function(key, parkID) {
        if(self.searchMap.has(key)) {
            self.searchMap.get(key).add(parkID);
        } else {
            self.searchMap.set(key, new Set([parkID]));
        }
    };

    self.resetParkList = function() {
        self.parkList.removeAll();
        for(let i = 0; i < self.allParks.length; i++) {
            self.parkList.push(self.allParks[i]);
        }
    };

}

var viewModel = new parkMapViewModel();
ko.applyBindings(viewModel);
