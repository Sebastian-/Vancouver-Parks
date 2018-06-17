'use strict';

const express = require('express');
const yelp = require('yelp-fusion');
const fs = require('fs');

const app = express();
const YELP_API_KEY = JSON.parse(fs.readFileSync('credentials.json', 'utf8'))['yelp-API-Key'];
const yelpClient = yelp.client(YELP_API_KEY);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile('index.html'));

app.get('/yelpReview/name/:parkName/latitude/:latitude/longitude/:longitude', (req, res) => {
    console.log({
        term: decodeURIComponent(req.params.parkName),
        latitude: decodeURIComponent(req.params.latitude),
        longitude: decodeURIComponent(req.params.longitude)
    });
    yelpClient.search({
        term: decodeURIComponent(req.params.parkName),
        latitude: decodeURIComponent(req.params.latitude),
        longitude: decodeURIComponent(req.params.longitude),
        categories: 'parks,gardens,playgrounds,beaches',
        locale: 'en_CA',
    }).then(yelpResponse => {
        const parks = yelpResponse.jsonBody.businesses;
        if(parks.length === 0
           || parks[0].distance > 2000
           || !hasParkNameOverlap(parks[0].name, decodeURIComponent(req.params.parkName))) {
            res.json({
                'rating': 0,
                'count': 0
            });
        } else {
            console.log(parks[0].name);
            console.log(parks[0].distance);
            res.json({
                'rating': parks[0].rating,
                'count': parks[0].review_count
            });
        }
    }).catch(e => {
        // TODO handle errors
        console.log(e);
    });
});

app.listen(8080, () => console.log('App is listening on port 8080!'));


// Returns true if name and parkName share any words aside from 'park'
function hasParkNameOverlap(name, parkName) {
    name = name.toLowerCase().trim();

    for(let word of parkName.split(/\s/)) {
        word = word.replace(/\W/, "").toLowerCase().trim();
        if(word === 'park') continue;
        if(name.includes(word)) return true;
    }

    return false;
};
