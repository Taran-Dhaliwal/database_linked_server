var express = require('express'),
    handlebars = require('express-handlebars').create({defaultLayout: 'main'}),
    cookieParser = require('cookie-parser'),
    sessions = require('express-session'),
    bodyParser = require('body-parser'),
    https = require('https'),
    fs = require('fs'),
    md5 = require('md5'),
    mongoose = require('mongoose'),
    credentials = require('./credentials'),
    Users = require('./models/uCredentials.js');
// load env variables
const dotenv = require("dotenv");
    dotenv.config();

var app = express();
//db connection
mongoose
	.connect(process.env.MONGO_URI, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
	})
	.then(() => console.log("DB Connected"));

mongoose.connection.on("error", (err) => {
	console.log(`DB connection error: ${err.message}`);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(credentials.cookieSecret));
app.use(sessions({
    resave: true,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    cookie: {maxAge: 3600000},
}));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3100);

app.get('/', function(req, res){
    res.render('login');
});

function checklogin (req, res, user, password) {
    Users.findOne({uname: user}, function(err, user) {
        if (err) {
            console.log('Error finding user: ' + uname + ' Error: ' + err);
        }
      
        if(user==null || user.pass != password ){
            res.render('login', {message: 'Username or password does not match our records. Please try again or register if you are a new user.'});

        }
        else{
        res.render('home');
        }
        
    });
};

app.post('/processLogin', function(req, res){
    //Determine if user is registering
    if (req.body.buttonVar == 'login') {
        checklogin(req, res, req.body.uname.trim(), req.body.pword.trim())
    } else {
        res.redirect(303, 'register');
    }
});

app.post('/processReg', function(req, res){

   if(req.body.pass==req.body.pword2){
    if (req.body.buttonVar == 'register') {

        const user = new Users(req.body);
       
        console.log(user);
        user.save((err, toDB) => {
            if(err){
               
                return res.status(400).json({
                    error:err,
                });
            }
        });
    }
   res.render('home');
}
else{
    res.render('register', {message: 'Both the password does not match!'} );
}

});



app.get('/home', function(req, res) {
    if (req.session.userName) {
        res.render('home');
    } else {
        res.render('login',{message: 'Please login to access the home page'});
    }
});

app.get('/page2', function(req, res) {
        res.render('page2');
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/logout', function(req, res) {
    delete req.session.userName;
    res.redirect(303,'/');
})


app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate');
});

process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error.message);
});