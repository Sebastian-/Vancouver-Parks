var parkMapViewModel = function() {
    var self = this;

    self.parks = ko.observableArray();
    $.ajax({
        type: "GET",
        url: "static/parks_facilities.xml",
        dataType: "xml",
        success: function(xml) {
            // Initialize park list
            var $parks = $(xml).find("Park");
            $parks.each(function(index, xmlPark) {
                self.parks.push(new Park(xmlPark));
            });
        },
        complete: function() {
            // Initialize markers
            var bounds = new google.maps.LatLngBounds();
            ko.utils.arrayForEach(self.parks(), function(park) {
                var latLng = new google.maps.LatLng(park.lat, park.lng);
                var marker = new google.maps.Marker({
                    position: latLng,
                    map: map
                });

                bounds.extend(latLng);
            });
            map.fitBounds(bounds);
        }
    });


}
