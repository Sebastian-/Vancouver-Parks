/**
* Represents a Park
* @constructor
* @param {XML Document} xmlParkData - Park data in XML format
*/

function Park(xmlParkData) {
    var self = this;
    let $parkData = $(xmlParkData);

    // TODO: reevaluate if id and siteURL are worthwhile/useful
    // TODO: consider including washroom/special features data
    self.id = $parkData.attr("ID");
    self.siteURL = "http://covapp.vancouver.ca/parkfinder/" +
                   "parkdetail.aspx?inparkid=" + self.id
    self.name = $parkData.find("Name").text();
    self.address = $parkData.find("StreetNumber").text() + " "
                 + $parkData.find("StreetName").text();
    self.neighbourhood = $parkData.find("NeighbourhoodName").text();
    self.latLong = $parkData.find("GoogleMapDest").text();
    self.facilities = [];
    $parkData.find("Facility").each(function(index, facility) {
        self.facilities.append({
            type: facility.find("FacilityType").text();
            count: facility.find("FacilityCount").text();
        });
    });
}
