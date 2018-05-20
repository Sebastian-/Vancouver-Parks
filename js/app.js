$(document).ready(function(){

	$.ajax({
		type: "GET",
	    url: "static/parks_facilities.xml",
	    dataType: "xml",
	    success: function(xml){
	    	var $xml = $(xml);
			var $names = $xml.find("Name");
			console.log($names);
			$names.each(function(key, val) {
				$("body").append(val.textContent + "<br>");
			});
	    }
	});

});