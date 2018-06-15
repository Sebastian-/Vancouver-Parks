'use strict';

const express = require('express');
const yelp = require('yelp-fusion');
const fs = require('fs');

const app = express();
const YELP_API_KEY = JSON.parse(fs.readFileSync('credentials.json', 'utf8'))['yelp-API-Key'];
const yelpClient = yelp.client(YELP_API_KEY);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile('index.html'));

app.get('/yelpReview/name/:parkName/address/:parkAddress', (req, res) => {
    yelpClient.businessMatch('lookup', {
        name: decodeURIComponent(req.params.parkName),
        address1: decodeURIComponent(req.params.parkAddress),
        city: 'Vancouver',
        state: 'BC',
        country: 'CA'
    }).then(response => {
        // TODO make sure to check that the response is an appropriate match
        // TODO handle errors
        console.log(response.jsonBody);
        yelpClient.business(response.jsonBody.businesses[0].id).then(response => {
            console.log(response.jsonBody);
            res.json({
                rating: response.jsonBody.rating,
                count: response.jsonBody.review_count
            });
        }).catch(e => {
            console.log(e);
        });
    }).catch(e => {
        console.log(e);
    });
});

app.listen(8080, () => console.log('App is listening on port 8080!'));
