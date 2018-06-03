var parkMapViewModel = function() {
    var self = this;

    self.map;
    self.parks = ko.observableArray();
    self.isParkListVisible = ko.observable(true);
    /* TODO map park id to markers to manage showing and hiding markers
    self.idToMarker = Map
    */

    // Load park data
    $.ajax({
        type: "GET",
        url: "static/parks_facilities.xml",
        dataType: "xml",
        success: function(xml) {
            // Initialize list of parks in sidebar
            var $parks = $(xml).find("Park");
            $parks.each(function(index, xmlPark) {
                self.parks.push(new Park(xmlPark));
            });
            // A filler <li> for easier navigation of the last elements in list
            $("#parkList").append("<li class='lastListItem'></li>");
        }
    });

    self.toggleParkList = function() {
        self.isParkListVisible(!self.isParkListVisible());
    }

    self.initMap = function() {
        self.map = new google.maps.Map(document.getElementById('map'), {
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
        self.map.fitBounds(bounds);
    };

}

var viewModel = new parkMapViewModel();
ko.applyBindings(viewModel);
