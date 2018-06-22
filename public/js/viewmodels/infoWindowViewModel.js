let infoWindowViewModel = function() {
    const self = this;

    self.parkName = ko.observable("");
    self.parkAddress = ko.observable("");
    self.hasYelpContent = ko.observable(false);
    self.yelpRating = ko.observable(0);
    self.yelpReviewCount = ko.observable(0);
    self.yelpURL = ko.observable("");

    self.hasYelpRating = ko.pureComputed(function() {
        return self.yelpReviewCount() !== 0;
    });
    self.imgSource = ko.pureComputed(function() {
        return "img/" + self.yelpRating() + "_star.png";
    });
    self.ratingSummary = ko.pureComputed(function() {
        return self.yelpRating() +
               " star" + (self.yelpRating() !== 1 ? "s" : "") +
               " with " + self.yelpReviewCount() +
               " review" + (self.yelpReviewCount() !== 1 ? "s" : "");
    });

    self.updateInfoWindow = function(data) {
        self.parkName(data.parkName || self.parkName());
        self.parkAddress(data.parkAddress || self.parkAddress());
        self.hasYelpContent(data.hasYelpContent || false);
        self.yelpRating(data.yelpRating || 0);
        self.yelpReviewCount(data.yelpReviewCount || 0);
        self.yelpURL(data.yelpURL || "");
    };
};
