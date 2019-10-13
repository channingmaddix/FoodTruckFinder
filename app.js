var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));
app.set("view engine", "ejs");

var coord = {};
var locations = [];

var ftLatArr = [30.252322, 30.254306, 30.246987, 30.261889];
var ftLongArr = [-81.586207, -81.564873, -81.584318, -81.577123];

app.get("/", function(req, res){
    res.render("home");
});



app.post("/search", function (req, res){
    console.log("/search action");
    console.log(req);
    console.log(req.params);
    var lat = req.body.lat;
    var long = req.body.long;
    console.log(lat);
    console.log(long);
    coord = { lat: lat, long: long};
    console.log("lat from coord object: " + coord.lat);
    locations.push(coord);
    console.log ("lat from locations arr: " + locations[locations.length - 1].lat);
    res.redirect("/map");
});

app.get("/map", function (req, res){
    console.log("map");
    var lat = locations[locations.length - 1].lat;
    var long = locations[locations.length - 1].long;
    console.log(lat, long);
    res.render("map", {lat: lat, long: long, ftLatArr: ftLatArr, ftLongArr: ftLongArr});
});

app.listen(3000, '127.0.0.1');