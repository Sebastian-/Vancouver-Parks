/**
* Represents a Park
* @constructor
* @param {XML Document} xmlParkData - Park data in XML format
*/

function Park(xmlParkData) {
    "use strict";

    var self = this;
    var $parkData = $(xmlParkData);

    self.keywords = [];
    self.name = $parkData.find("Name").text();
    self.keywords.push(self.name.toLowerCase());
    self.neighbourhood = $parkData.find("NeighbourhoodName").text();
    self.keywords.push(self.neighbourhood.toLowerCase());

    self.id = parseInt($parkData.attr("ID"));
    self.siteURL = "http://covapp.vancouver.ca/parkfinder/" +
                   "parkdetail.aspx?inparkid=" + self.id;
    self.streetNumber = $parkData.find("StreetNumber").text();
    self.streetName = $parkData.find("StreetName").text();
    self.address = self.streetNumber + " " + self.streetName;

    var LatLng = $parkData.find("GoogleMapDest").text().split(",");
    self.lat = parseFloat(LatLng[0]);
    self.lng = parseFloat(LatLng[1]);

    self.facilities = [];
    $parkData.find("Facility").each(function(index, facility) {
        const facilityType = $(facility).find("FacilityType").text();
        self.keywords.push(facilityType.toLowerCase());
        self.facilities.push({
            type: facilityType,
            count: $(facility).find("FacilityCount").text()
        });
    });
}
