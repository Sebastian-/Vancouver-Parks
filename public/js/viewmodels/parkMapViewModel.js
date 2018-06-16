var parkMapViewModel = function() {
    const self = this;

    self.googleMap;
    self.infoWindow;
    self.allParks = [];
    self.parkList = ko.observableArray();
    self.isParkListVisible = ko.observable(true);
    self.searchQuery = ko.observable("");

    // Maps autocomplete search terms {String} to resulting set of park IDs {Set(Integer)}
    self.searchMap = new Map();

    // Maps park.id {Integer} to corresponding map marker {google.map.Marker}
    self.parkIdToMarker = new Map();

    // TODO handle errors
    let loadParks = $.ajax({
        type: "GET",
        url: "parks_facilities.xml",
        dataType: "xml",
        success: function(xmlResponse) {
            self.initListOfParks(xmlResponse);
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
        self.setInfoWindow();
        $.when(loadParks).then(self.initMarkers);
    };


    self.setGoogleMap = function() {
        self.googleMap = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 49.255, lng: -123.130},
            zoom: 13,
            mapTypeControl: false
        });
    };

    self.setInfoWindow = function() {
        self.infoWindow = new google.maps.InfoWindow({
            content:""
        });
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
            marker.addListener("click", function() {
                self.displayInfoWindow(park);
            });
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
        };
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


    // TODO query doesn't match if case is not exactly the same
    self.searchParks = function() {
        // autocomplete field won't update properly without refocusing
        $("#searchBarInput").blur();
        $("#searchBarInput").focus();
        let query = self.searchQuery().trim();
        self.infoWindow.close();

        if(!self.searchMap.has(query)) {
            self.displayNoSearchResults();
            return;
        }

        self.resetParkList();
        let result = self.searchMap.get(query);
        self.parkList.remove( function(park) {
            return !result.has(park.id);
        });
        self.updateMarkers();
    };

    self.displayNoSearchResults = function() {
        $("#parkList").empty();
        $("#parkList").append('<li class="noResultListItem">No Results Found</li>')
        self.unpinAllMarkers();
    };

    self.displayInfoWindow = function(park) {
        self.populateInfoWindow(park);
        self.infoWindow.open(map, self.parkIdToMarker.get(park.id));
        self.googleMap.panTo(self.parkIdToMarker.get(park.id).getPosition());
    };

    self.populateInfoWindow = function(park) {
        // TODO handle errors
        let getReview = self.getYelpReview(park);
        getReview.then(function(review) {
            let rating = review.rating;
            let reviewCount = review.count;

            // TODO review/reviews for 0/1/2+ reviewCount
            let infoWindowContent =
            `<div class="infoWindowContent">
                <h3 class="infoWindowHeader">${park.name}</h3>
                <p class="infoWindowParkAddress">${park.address}</p>
                <p>${rating} stars with ${reviewCount} reviews</p>
            </div>`;

            self.infoWindow.setContent(infoWindowContent);
        }, function(error) {
            console.log(error);
        });
    };

    self.getYelpReview = function(park) {
        // TODO handle .fail
        return new Promise(function(resolve, reject) {
            let queryURL = "http://localhost:8080/yelpReview/";
            queryURL += self.formatQueryParams({
                "name": park.name,
                "latitude": park.lat,
                "longitude": park.lng
            });

            $.getJSON(encodeURI(queryURL), function(response) {
                resolve(response);
            }).fail(function(response) {
                reject(response);
            });
        });
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

    self.formatQueryParams = function(params) {
        let query = "";
        Object.keys(params).forEach(function(key,index) {
            query += encodeURIComponent(key) + "/" + encodeURIComponent(params[key]) + "/";
        });

        // some park info has single quotes (eg. Coopers' Park)
        return query.replace(/'/g, '%27');
    }

}

var viewModel = new parkMapViewModel();
ko.applyBindings(viewModel);
