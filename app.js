var express = require("express");
var session = require("express-session");
var app = express();
var bodyParser = require("body-parser");
const sql = require("mssql");
var bcrypt =  require('bcryptjs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));
app.set("view engine", "ejs");

var config = {
    user: 'xxxxxx',
    password: 'xxxxxx',
    server: 'xxxxxxx',
    encrypt: true,
    port: 1433,
    database: 'FoodTruckFinder'
};

const pool = new sql.ConnectionPool(config);

pool.connect(err => {
    // ...
    console.log(err);
});

app.use(session({
    secret: 'keyboard cat is the best cat', 
    cookie: { maxAge: 1000 * 60 * 5 } // 5 min
})); 

app.get("/", function(req, res){
    res.render("home", {userId: req.session.UserId});
});

//-----Sign Up------------------------------------------------------------------------------
app.get("/signup", function(req, res){
    res.render("signup");
});

app.post("/signup", function(req, res){
    console.log(req.body);
    var username = req.body.username;
    var email = req.body.email;
    var salt = bcrypt.genSaltSync(10);
    var password = bcrypt.hashSync(req.body.password, salt);
    console.log(password);
    const transaction = new sql.Transaction(pool);
    console.log(username);
    console.log(email);

    transaction.begin(err => {
	    // ... error checks
	 
	    let rolledBack = false;
	 
	    transaction.on('rollback', aborted => {
	        // emited with aborted === true
	 
	        rolledBack = true
	    })
        new sql.Request(transaction).query("insert into users (Email, UserPassword) values ('" + email + "', '" + password + "')", 
        (err, result) => {
	        // insert should fail because of invalid value
	        if (err) {
	            if (!rolledBack) {
	                transaction.rollback(err => {
	                    // ... error checks
	                });
	            res.send(err);
	            }
	        } else {
	            transaction.commit(err => {
	                // ... error checks
	            });
	        }
        });
    });
    res.redirect('/login'); 
});

//-----Login-----------------------------------------------------------------------------------------
app.get("/login", function(req, res){
    res.render('login');
});

app.post("/login", function(req, res){

    const transaction = new sql.Transaction(pool);
	transaction.begin(err => {
	    // ... error checks
	 
	    let rolledBack = false;
	 
	    transaction.on('rollback', aborted => {
	        // emited with aborted === true
	 
	        rolledBack = true
	    })
	 	new sql.Request(transaction).query("select UserId, UserPassword from Users where Email='"+req.body.email+"'", (err, result) => {
             console.log(result.recordset[0].UserPassword);
                if (bcrypt.compareSync(req.body.password, result.recordset[0].UserPassword)){
                    req.session.UserId = result.recordset[0].UserId;
                    res.redirect('/profile');
                }else{
                    wrongPass = true;
                    res.render('login', {wrongPass: wrongPass});
                }
	    });
	});
});

//-----Profile----------------------------------------------------------------------------------------------
app.get("/profile", function(req, res){
    var email;
    var username;
    const transaction = new sql.Transaction(pool);
	transaction.begin(err => {
	    // ... error checks
	 
	    let rolledBack = false;
	 
	    transaction.on('rollback', aborted => {
	        // emited with aborted === true
	 
	        rolledBack = true;
	    });
	 	new sql.Request(transaction).query("select Email from Users where UserId="+req.session.UserId, (err, result) => {
            email = result.recordset[0].Email;
            res.render('profile', {email: email, userId: req.session.UserId});
        });
    });
});

//-----User Search and Map------------------------------------------------------------------------
app.post("/search", function (req, res){
    console.log("/search action");
    var lat = req.body.lat;
    var long = req.body.long;
    console.log(lat);
    console.log(long);
    res.redirect("/map/" + lat + "/" + long);
});

app.get("/map/:lat/:long", function (req, res){
    var lat = parseFloat(req.params.lat);
    var long = parseFloat(req.params.long);
    // var lat = req.body.lat;
    // var long = req.body.long;
    var ftNameArr = [];
    var ftLatArr = [];
    var ftLongArr = [];
    var cuisineArr = [];
    const transaction = new sql.Transaction(pool);
	transaction.begin(err => {
	    // ... error checks
	 
	    let rolledBack = false;
	 
	    transaction.on('rollback', aborted => {
	        // emited with aborted === true
	 
	        rolledBack = true;
	    });
	 	new sql.Request(transaction).query("SELECT ftName, Cuisine, Latitude, Longitude from Users WHERE Latitude IS NOT NULL", (err, result) => {
             console.log(result.recordset);
            for (var i = 0; i < result.recordset.length; i++){
                ftNameArr.push(result.recordset[i].ftName);
                cuisineArr.push(result.recordset[i].Cuisine);
                ftLatArr.push(result.recordset[i].Latitude);
                ftLongArr.push(result.recordset[i].Longitude);
            }
            res.render("map", {lat: lat, long: long, ftNameArr: ftNameArr, cuisineArr: cuisineArr, ftLatArr: ftLatArr, ftLongArr: ftLongArr, userId: req.session.UserId});
        });
    });
});

//-----Create Food Truck-------------------------------------------------------------------------------
app.get("/createFoodTruck", function(req, res){
    res.render('createFoodTruck', {userId: req.session.UserId});
});

app.post("/createFoodTruck", function(req, res){
    var ftName = req.body.ftName;
    var cuisine = req.body.cuisine;
    console.log(ftName);
    const transaction = new sql.Transaction(pool);
	transaction.begin(err => {
	    // ... error checks
	 
	    let rolledBack = false;
	 
	    transaction.on('rollback', aborted => {
	        // emited with aborted === true
	 
	        rolledBack = true
	    })
	 	new sql.Request(transaction).query("UPDATE Users SET ftName = '"+ ftName + "', Cuisine = '" + cuisine + "' WHERE UserId =" + req.session.UserId,  (err, result) => {
             // insert should fail because of invalid value
	        if (err) {
	            if (!rolledBack) {
	                transaction.rollback(err => {
	                    // ... error checks
	                });
	            res.send(err);
	            }
	        } else {
	            transaction.commit(err => {
                    // ... error checks
                    res.redirect('/ftProfile');
	            });
	        }
        });
    });
});

//-----Food Truck Profile & Update Location-----------------------------------------------------------------------------------------
app.get("/ftProfile", function(req, res){
    var ftName;
    var cuisine;
    var latitude;
    var longitude;
    const transaction = new sql.Transaction(pool);
	transaction.begin(err => {
	    // ... error checks
	 
	    let rolledBack = false;
	 
	    transaction.on('rollback', aborted => {
	        // emited with aborted === true
	 
	        rolledBack = true;
	    });
	 	new sql.Request(transaction).query("SELECT ftName, Cuisine, Latitude, Longitude from Users where UserId = " + req.session.UserId, (err, result) => {
            ftName = result.recordset[0].ftName;
            cuisine = result.recordset[0].Cuisine;
            latitude = result.recordset[0].Latitude;
            longitude = result.recordset[0].Longitude;
            res.render('ftProfile', {ftName: ftName, cuisine: cuisine, latitude: latitude, longitude: longitude, userId: req.session.UserId});
        });
    });
});

app.post("/updateLocation", function(req, res){
    var lat = req.body.lat;
    var long = req.body.long;
    const transaction = new sql.Transaction(pool);
	transaction.begin(err => {
	    // ... error checks
	 
	    let rolledBack = false;
	 
	    transaction.on('rollback', aborted => {
	        // emited with aborted === true
	 
	        rolledBack = true
	    })
	 	new sql.Request(transaction).query("UPDATE Users SET Latitude = " + lat + ", Longitude = " + long + " WHERE UserId = " + req.session.UserId, (err, result) => {
            if (err) {
	            if (!rolledBack) {
	                transaction.rollback(err => {
	                    // ... error checks
	                });
	            res.send(err);
	            }
	        } else {
	            transaction.commit(err => {
                    // ... error checks
                    res.redirect('/ftProfile');
	            });
	        }
	    });
	});
});

app.listen(3000, '127.0.0.1');