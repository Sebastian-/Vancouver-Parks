let parkMapViewModel = function() {
    "use strict";

    const self = this;
    self.googleMap = null;
    self.infoWindow = null;
    self.infoWindowViewModel = null;
    self.selectedMarker = null;
    self.allParks = [];
    self.parkList = ko.observableArray();
    self.isParkListVisible = ko.observable(true);
    self.searchQuery = ko.observable("");

    // Maps park.id {Integer} to corresponding map marker {google.map.Marker}
    self.parkIdToMarker = new Map();


    // Load XML file containing park data and initialize the application
    const loadParks = $.ajax({
        type: "GET",
        url: "parks_facilities.xml",
        dataType: "xml",
        success: function(xmlResponse) {
            self.initListOfParks(xmlResponse);
            // TODO: uncomment after Udacity Review
            // self.initSearchBox();
        }
    }).fail(function() {
        alert("Could not load park data :(");
    });


    // Initializes the list of parks displayed in the sidebar
    self.initListOfParks = function(xmlParkData) {
        const $parks = $(xmlParkData).find("Park");
        $parks.each( function(index, xmlPark) {
            const park = new Park(xmlPark);
            self.allParks.push(park);
            self.parkList.push(park);
        });
    };

    /* Disabled to comply with Udacity criteria
       TODO: uncomment after Udacity review
    // Creates a jQuery autocomplete input element
    self.initSearchBox = function() {
        let suggestions = new Set();
        for(let i = 0; i < self.allParks.length; i++) {
            const park = self.allParks[i];
            suggestions.add(park.name);
            suggestions.add(park.neighbourhood);
            ko.utils.arrayForEach(park.facilities, function(facility) {
                suggestions.add(facility.type);
            });
        };
        $("#searchBarInput").autocomplete({
            source: Array.from(suggestions),
            minLength: 2
        });
    };
    */

    // Initialize all Google Map related elements
    self.initGoogleMap = function() {
        self.setGoogleMap();
        self.setInfoWindow();
        // Park data must be loaded in order to initialize marker locations
        $.when(loadParks).then(self.initMarkers);
    };


    // Initializes the Google Map object in the DOM
    self.setGoogleMap = function() {
        self.googleMap = new google.maps.Map(document.getElementById("map"), {
            center: {lat: 49.255, lng: -123.130},
            zoom: 13,
            mapTypeControl: false,
            styles: MAP_STYLE
        });
    };

    // Creates info window and binds to the infoWindowViewModel
    self.setInfoWindow = function() {
        self.infoWindow = new google.maps.InfoWindow({
            content: document.getElementById("infoWindowTemplate").innerHTML
        });
        self.infoWindowViewModel = new infoWindowViewModel();
        ko.applyBindings(self.infoWindowViewModel, document.getElementById("infoWindowContent"));
    };


    // Creates a marker for every park object
    self.initMarkers = function() {
        const bounds = new google.maps.LatLngBounds();
        ko.utils.arrayForEach(self.allParks, function(park) {
            const latLng = new google.maps.LatLng(park.lat, park.lng);
            bounds.extend(latLng);
            const marker = new google.maps.Marker({
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


    // Updates markers to only display for parks shown in the sidebar
    self.updateMarkers = function() {
        self.unpinAllMarkers();
        self.pinParkListMarkers();
    };

    // Removes all markers from the map
    self.unpinAllMarkers = function() {
        for(let marker of self.parkIdToMarker.values()) {
            marker.setMap(null);
        }
    };

    // Pins markers on the map corresponding to the parks in self.parkList()
    // and adjusts the map bounds as necessary
    self.pinParkListMarkers = function() {
        const bounds = new google.maps.LatLngBounds();
        ko.utils.arrayForEach(self.parkList(), function(park) {
            const marker = self.parkIdToMarker.get(park.id);
            marker.setMap(self.googleMap);
            bounds.extend(marker.getPosition());
        });
        if(self.parkList().length > 1) {
            self.googleMap.fitBounds(bounds);
        }
    };


    // Toggles the display of the list of parks in the sidebar
    self.toggleParkList = function() {
        self.isParkListVisible(!self.isParkListVisible());
    };


    // Filters park list based on the text of self.searchQuery()
    self.searchParks = function() {
        self.infoWindow.close();
        self.parkList.removeAll();

        const query = self.searchQuery().trim().toLowerCase();
        for(let i = 0; i < self.allParks.length; i++) {
            const park = self.allParks[i];
            for(let j = 0; j < park.keywords.length; j++) {
                if(park.keywords[j].includes(query)) {
                    self.parkList.push(park);
                    break;
                }
            }
        }
        self.updateMarkers();
        if(self.parkList().length === 1) {
            self.displayInfoWindow(self.parkList()[0]);
        }
    };


    // Displays the application when no parks match the search filter
    self.displayNoSearchResults = function() {
        self.parkList.removeAll();
        self.unpinAllMarkers();
    };

    // Displays the info window of the input park
    self.displayInfoWindow = function(park) {
        // Manage the animation of the previous/newly selected markers
        if(self.selectedMarker) self.selectedMarker.setAnimation(null);
        self.selectedMarker = self.parkIdToMarker.get(park.id);
        self.selectedMarker.setAnimation(google.maps.Animation.BOUNCE);

        // Fill the info window with relevant content and focus
        self.infoWindow.open(map, self.selectedMarker);
        self.populateInfoWindow(park);
        self.googleMap.panTo(self.selectedMarker.getPosition());
    };


    // Populates the info window with information on the input park
    self.populateInfoWindow = function(park) {
        if(park.name === self.infoWindowViewModel.parkName()) return;

        // Update info window with immediately available data
        self.infoWindowViewModel.updateInfoWindow({
            "parkName": park.name,
            "parkAddress": park.address
        });
        self.infoWindow.setContent(document.getElementById("infoWindowTemplate").innerHTML);

        // Attempt to fetch Yelp review data
        self.getYelpReview(park).then(function(review) {
            self.infoWindowViewModel.updateInfoWindow({
                "hasYelpContent": true,
                "yelpRating": review.rating,
                "yelpReviewCount": review.count,
                "yelpURL": review.yelpURL
            });
            self.infoWindow.setContent(document.getElementById("infoWindowTemplate").innerHTML);
        }, function(error) {
            $("#infoWindowContent").append("<p>Query for Yelp rating failed :(</p>");
            console.error(error);
        });

    };


    // Query the server for a Yelp review
    // Returns a promise which resolves to a json containing review data
    // or rejects with the response recieved by the server
    self.getYelpReview = function(park) {
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
    };


    // Restores all parks to self.parkList
    self.resetParkList = function() {
        self.parkList.removeAll();
        self.infoWindow.close();
        for(let i = 0; i < self.allParks.length; i++) {
            self.parkList.push(self.allParks[i]);
        }
        self.pinParkListMarkers();
    };


    // Formats query parameters for queries made to the server
    self.formatQueryParams = function(params) {
        let query = "";
        Object.keys(params).forEach(function(key,index) {
            query += encodeURIComponent(key) + "/" + encodeURIComponent(params[key]) + "/";
        });

        // some park info has single quotes (eg. Coopers' Park)
        return query.replace(/'/g, '%27');
    };

};

var viewModel = new parkMapViewModel();
ko.applyBindings(viewModel, document.getElementById("parkListSidebar"));
