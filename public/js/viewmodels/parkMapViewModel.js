"use strict";

let parkMapViewModel = function() {
    const self = this;

    self.googleMap;
    self.infoWindow;
    self.selectedMarker;
    self.allParks = [];
    self.parkList = ko.observableArray();
    self.isParkListVisible = ko.observable(true);
    self.searchQuery = ko.observable("");

    // Maps autocomplete search terms {String} to resulting set of park IDs {Set(Integer)}
    self.searchMap = new Map();

    // Maps park.id {Integer} to corresponding map marker {google.map.Marker}
    self.parkIdToMarker = new Map();


    // Load XML file containing park data and initialize the application
    const loadParks = $.ajax({
        type: "GET",
        url: "parks_facilities.xml",
        dataType: "xml",
        success: function(xmlResponse) {
            self.initListOfParks(xmlResponse);
            self.initSearchMap();
            self.initSearchBox();
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


    // Initializes the mapping of search terms to resulting parks (via ID)
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


    // Creates a jQuery autocomplete input element
    self.initSearchBox = function() {
        $("#searchBarInput").autocomplete({
            source: Array.from(self.searchMap.keys()),
            minLength: 2
        });
    };


    // Initialize all Google Map related elements
    self.initGoogleMap = function() {
        self.setGoogleMap();
        self.setInfoWindow();
        // Park data must be loaded in order to initialize marker locations
        $.when(loadParks).then(self.initMarkers);
    };


    // Initializes the Google Map object in the DOM
    self.setGoogleMap = function() {

        // Map styling sourced from https://snazzymaps.com/style/74/becomeadinosaur
        const mapStyle = [
            {
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#f5f5f2"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "administrative",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.attraction",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "landscape.man_made",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.business",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.medical",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.place_of_worship",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.school",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.sports_complex",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "visibility": "simplified"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "stylers": [
                    {
                        "visibility": "simplified"
                    },
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "stylers": [
                    {
                        "color": "#71c8d4"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "stylers": [
                    {
                        "color": "#e5e8e7"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "stylers": [
                    {
                        "color": "#8ba129"
                    }
                ]
            },
            {
                "featureType": "road",
                "stylers": [
                    {
                        "color": "#ffffff"
                    }
                ]
            },
            {
                "featureType": "poi.sports_complex",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#c7c7c7"
                    },
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "stylers": [
                    {
                        "color": "#a0d3d3"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "stylers": [
                    {
                        "color": "#91b65d"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "stylers": [
                    {
                        "gamma": 1.51
                    }
                ]
            },
            {
                "featureType": "road.local",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "on"
                    }
                ]
            },
            {
                "featureType": "poi.government",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "simplified"
                    }
                ]
            },
            {
                "featureType": "road.local",
                "stylers": [
                    {
                        "visibility": "simplified"
                    }
                ]
            },
            {
                "featureType": "road"
            },
            {
                "featureType": "road"
            },
            {},
            {
                "featureType": "road.highway"
            }
        ];

        self.googleMap = new google.maps.Map(document.getElementById("map"), {
            center: {lat: 49.255, lng: -123.130},
            zoom: 13,
            mapTypeControl: false,
            styles: mapStyle
        });
    };

    // Creates an empty info window
    self.setInfoWindow = function() {
        self.infoWindow = new google.maps.InfoWindow({
            content:""
        });
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
        for(const marker of self.parkIdToMarker.values()) {
            marker.setMap(null);
        };
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
        };
    }


    // Toggles the display of the list of parks in the sidebar
    self.toggleParkList = function() {
        self.isParkListVisible(!self.isParkListVisible());
    };


    // Filters park list based on the text of self.searchQuery()
    self.searchParks = function() {
        // autocomplete text does not update properly without refocusing
        // i.e. knockoutJS/most browsers do not seem to recognize updates to
        // the input text when a selection is made from the suggestions menu
        $("#searchBarInput").blur();
        $("#searchBarInput").focus();

        // Close the info window since it is no longer relevant when the user
        // is searching
        self.infoWindow.close();

        const query = self.searchQuery().trim();

        if(!self.searchMap.has(query)) {
            self.displayNoSearchResults();
            return;
        }

        self.resetParkList();
        const matchingParks = self.searchMap.get(query);
        self.parkList.remove(function(park) {
            return !matchingParks.has(park.id);
        });
        self.updateMarkers();
        if(self.parkList().length === 1) {
            self.displayInfoWindow(self.parkList()[0]);
        };
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
        self.populateInfoWindow(park);
        self.infoWindow.open(map, self.selectedMarker);
        self.googleMap.panTo(self.selectedMarker.getPosition());
    };


    // Populates the info window with information on the input park
    self.populateInfoWindow = function(park) {
        // Do not repopulate the infowindow if multiple clicks have been made
        // on the same park
        if($(".infoWindowHeader").text() === park.name) return;

        // Display default content available for all parks
        const infoWindowContent =
            `<div id="infoWindowContent">
                <h3 class="infoWindowHeader">${park.name}</h3>
                <p class="infoWindowParkAddress">${park.address}</p>
            </div>`;
        self.infoWindow.setContent(infoWindowContent);

        // Attempt to append Yelp rating
        let getReview = self.getYelpReview(park);
        getReview.then(function(review) {
            const rating = review.rating;
            const reviewCount = review.count;

            if(reviewCount === 0) {
                $("#infoWindowContent").append("<p>No Yelp Reviews Available</p>");
                return;
            };

            // Per Yelp display requirements, display star sprites and logo
            $("<img>", {
                id: "yelpRatingStars",
                src: "img/" + rating + "_star.png",
                "height": "20px"
            }).appendTo("#infoWindowContent");

            $("<a/>", {
                "id": "yelpURL",
                "href": review.yelpURL
            }).appendTo("#infoWindowContent");

            $("<img>", {
                "id": "yelpTM",
                "src": "img/Yelp_tm.png",
                "height": "40px"
            }).appendTo("#yelpURL");

            $("#infoWindowContent").append("<p> "
                                           + rating + " star"+ (rating !== 1 ? "s" : "")
                                           + " with " + reviewCount + " review"
                                           + (reviewCount !== 1 ? "s" : "") +"</p>");
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
    }


    // Adds a search string and resulting park id into the search map
    self.addToSearchMap = function(key, parkID) {
        if(self.searchMap.has(key)) {
            self.searchMap.get(key).add(parkID);
        } else {
            self.searchMap.set(key, new Set([parkID]));
        }
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


    // Formats query parameters for queries made to the expressJS server
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
