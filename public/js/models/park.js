/**
* Represents a Park
* @constructor
* @param {XML Document} xmlParkData - Park data in XML format
*/

function Park(xmlParkData) {
    var self = this;
    var $parkData = $(xmlParkData);

    // TODO: reevaluate if id and siteURL are worthwhile/useful
    // TODO: consider including washroom/special features data
    self.id = parseInt($parkData.attr("ID"));
    self.siteURL = "http://covapp.vancouver.ca/parkfinder/" +
                   "parkdetail.aspx?inparkid=" + self.id
    self.name = $parkData.find("Name").text();
    self.streetNumber = $parkData.find("StreetNumber").text();
    self.streetName = $parkData.find("StreetName").text();
    self.address = self.streetNumber + " " + self.streetName;
    self.neighbourhood = $parkData.find("NeighbourhoodName").text();

    var LatLng = $parkData.find("GoogleMapDest").text().split(",");
    self.lat = parseFloat(LatLng[0]);
    self.lng = parseFloat(LatLng[1]);

    self.facilities = [];
    $parkData.find("Facility").each(function(index, facility) {
        self.facilities.push({
            type: $(facility).find("FacilityType").text(),
            count: $(facility).find("FacilityCount").text()
        });
    });
}
