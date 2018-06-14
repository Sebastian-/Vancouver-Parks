const express = require('express');
const app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile('index.html'));

app.get('/yelpReview/name/:parkName/address/:parkAddress', function(req, res) {
    console.log(req.params);
});

app.listen(8080, () => console.log('App is listening on port 8080!'));
