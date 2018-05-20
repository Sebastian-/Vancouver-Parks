$(document).ready(function(){

	$.ajax({
		type: "GET",
	    url: "static/parks_facilities.xml",
	    dataType: "xml",
	    success: function(xml){
	    	var $xml = $(xml);
			var $parks = $xml.find("Park");
			console.log($parks);
			$parks.each(function(key, val) {
				$("body").append($(val).find("Name").text() + "<br>");
			});
	    }
	});

});