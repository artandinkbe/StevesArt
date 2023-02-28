const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser= require('body-parser');
const app = express();
const session = require('express-session');
const cookieParser = require("cookie-parser");
const flash = require('connect-flash');
const nodemailer = require('nodemailer');
const SHA256 = require('crypto-js/sha256');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require('path');
const fileupload = require("express-fileupload");
const CryptoJS = require('crypto-js');

module.exports = app;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.json());
app.use(fileupload());

let vars = "StevesArtShopOostende";
let CID = "634260606963-77s6c4t5i3phmmcqtnj1pth2i7du4r9e.apps.googleusercontent.com";
let CS = "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";
let RT = "1//049i1GOK4cEDvCgYIARAAGAQSNwF-L9IrITl98DZ8lmtYo0AUHhlUSHyUg-4xQaC4rJaHt4cPGF0qj0GzzqobmM4JwUC_kLnJChU";

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: vars,
    saveUninitialized:true,
    cookie: {maxAge: oneDay},
    resave: false 
}));


// views is directory for all template files
app.set('views', __dirname + '/html');
app.set('view engine', 'ejs');

// MongoDB Vars
const uri = "mongodb+srv://FT95:Maputo2335@stevescia.mrnkgxd.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// End Of MongoDB Vars

client.connect(err => {
  // Check connectivity
	console.log('Connection test positive..');
	console.log('..Connected.');	
});

app.use(flash());

// Date Vars
const date = new Date();
let day = date.getDate();
let month = date.getMonth() + 1;
let year = date.getFullYear();
let currentDate = day + "-" + month + "-" + year;
let hour = date.getHours();
let minutes = date.getMinutes();
let seconds = date.getSeconds();
let currentTime = hour + ":" + minutes + ":" + seconds;
// End Of Date Vars

// Get favicon

// Steves VARS
var stevesDB = client.db("StevesCIA").collection("CIA");
var adminpw = "stevecia";


app.get('/', function(req, res) {
	
	stevesDB.findOne({"_shop":"CIA"}).then(result =>{
		let slideshow = result._slideshow;
		res.render('pages/home', {slideshow});
	})
	
});

app.get('/about', function(req, res) {
	res.render('pages/about');

});

app.get('/contact', async (req, res) => {
	let success = req.flash('success');
	res.render('pages/contact', {success});
});

app.get('/gallery', async (req, res) => {
	stevesDB.findOne({"_shop":"CIA"}).then(result =>{
		let showcase = result._gallery;
		res.render('pages/gallery',{showcase});
	})
});



app.get('/galleryupload', async (req, res) => {
	var success = req.flash('success');
	var wrongpw = req.flash('wrongpw');
	stevesDB.findOne({"_username": adminpw}).then(result=>{
			let lepw = result._username;
			
		res.render('pages/galleryupload', {success, wrongpw, lepw});
	})
});

app.get('/location', async (req, res) => {
	res.render('pages/location');
});

app.post("/uploadartwork", async (req, res) => {
	
	let password = req.body.password;
	let title = req.body.arttitle;
	let description = req.body.artdescription;
	let client = req.body.artclient;
	var artworkid = crypto.randomBytes(20).toString('hex');
	
	
	if (password === adminpw){
		
		let target_file = req.files.artwork;

		var file_name = "stevesart"+target_file.name;
		var path = __dirname + '\\images\\uploads\\' + file_name;
		var displaypath = '/images/uploads/' + file_name;
		// target_file.mv(path, callback)
		target_file.mv(path, (err) => {
		   if (err) throw err;
		})
		
		let thebuff = req.files.artwork.data;
		let imgtype = req.files.artwork.mimetype;
		
		function hexToBase64(thebuff) {
			let a = thebuff.toString('base64');
			return a;
		}
		
		var artworkbase = { 
		
			_title: title,
			_description: description,
			_datecreated: currentDate,
			_client: client,
			_path: displaypath,
			_artworkid: artworkid,
			_mimetype: imgtype,
			_b64: hexToBase64(thebuff),
			
		}

		stevesDB.updateOne({"_shop": "CIA"}, {$push: { _gallery: artworkbase }});
		
		
			
	
		
		req.flash('success', 'Artwork uploaded!');
		res.redirect('/galleryupload');
	}else{
		req.flash('wrongpw', 'Password entered is wrong!');
		res.redirect('/galleryupload');
	}
	
	
});

app.post("/slideshowupload", async (req, res) => {
	
	var artworkid = crypto.randomBytes(20).toString('hex');
	let imgclass = req.body.classpic;
	let imgid = req.body.idpic;
	
	let target_file = req.files.slideartwork;

	var file_name = "stevesart"+target_file.name;
	var path = __dirname + '\\images\\uploads\\' + file_name;
	var displaypath = '/images/uploads/' + file_name;
	// target_file.mv(path, callback)
	target_file.mv(path, (err) => {
	   if (err) throw err;
	})
	
	let thebuff = target_file.data;
	let imgtype = target_file.mimetype;
	
	function hexToBase64(thebuff) {
		let a = thebuff.toString('base64');
		return a;
	}
	
	var slidebase = { 
	
		_datecreated: currentDate,
		_path: displaypath,
		_artworkid: artworkid,
		_mimetype: imgtype,
		_b64: hexToBase64(thebuff),
		_c: imgclass,
		_id: imgid,
	}

	stevesDB.updateOne({"_shop": "CIA"}, {$push: { _slideshow: slidebase }});

	req.flash('success', 'Slide uploaded!');
	res.redirect('/admindashboard');

});

app.get('/test', async (req, res) => {
	stevesDB.findOne({"_username": adminpw}).then(result=>{
		let slideshow = result._slideshow;
		res.render('pages/test', {slideshow});
	})
});

app.post("/slideshowremove/:artworkid", async (req, res) => {
	
	let artid = req.params.artworkid;
	
	stevesDB.updateOne({"_shop":"CIA"}, {$pull: {"_slideshow": {"_artworkid": artid}}});
	
	
	req.flash('success', 'Slide removed!');
	res.redirect('/admindashboard');
	
});

app.post("/modifygallery/:artworkid/:entry", async (req, res) => {
	
	let entrynr = req.params.entry;
	
	let artid = req.params.artworkid;

	let newtitle = req.body.arttitle;
	let newdescription = req.body.artdescription;
	let newclient = req.body.artclient;
	let newartdate = req.body.artdate;
	
	
	let tfunc = '{"_gallery.'+entrynr+'._title"'+":"+'"'+newtitle+'"'+'}';
	let dtfunc = '{"_gallery.'+entrynr+'._datecreated"'+":"+'"'+newartdate+'"'+'}';
	let dfunc = '{"_gallery.'+entrynr+'._description"'+":"+'"'+newdescription+'"'+'}';
	let cfunc = '{"_gallery.'+entrynr+'._client"'+":"+'"'+newclient+'"'+'}';

	let titlefunc = JSON.parse(tfunc);
	let datefunc = JSON.parse(dtfunc);
	let descfunc = JSON.parse(dfunc);
	let clifunc = JSON.parse(cfunc);
	
	if(newtitle != ""){
		stevesDB.updateOne({"_gallery._artworkid": artid}, {$set: titlefunc});
	}
	
	if(newartdate != ""){
		stevesDB.updateOne({"_gallery._artworkid": artid}, {$set: datefunc});
	}
	
	if(newdescription != ""){
		stevesDB.updateOne({"_gallery._artworkid":{$eq: artid}}, {$set: descfunc});
	}
	
	if(newclient != ""){
		stevesDB.updateOne({"_gallery._artworkid":{$eq: artid}}, {$set: clifunc});
	}
	
	
	let filenamepicture = req.body.artworklog;
	
	if(filenamepicture != ""){
		let target_file = req.files.artwork;
		var file_name = filenamepicture+target_file.name;
		var path = __dirname + '\\images\\uploads\\' + file_name;
		var displaypath = '/images/uploads/' + file_name;
		// target_file.mv(path, callback)
		target_file.mv(path, (err) => {
		   if (err) throw err;
		})
		
		
		
		let imgtype = req.files.artwork.mimetype;
		
		function hexToBase64() {
			let thebuff = req.files.artwork.data;
			let a = thebuff.toString('base64');
			return a;
		}
		
		
		let bfunc = '{"_gallery.'+entrynr+'._b64"'+":"+'"'+hexToBase64()+'"'+'}';
		let mimefunc = '{"_gallery.'+entrynr+'._mimetype"'+":"+'"'+imgtype+'"'+'}';

		let b64func = JSON.parse(bfunc);
		let mfunc = JSON.parse(mimefunc);

		stevesDB.updateOne({"_gallery._artworkid": artid}, {$set: b64func});
		stevesDB.updateOne({"_gallery._artworkid": artid}, {$set: mfunc});
	}
	
	req.flash('success', 'Entry Modified!');
	res.redirect('/admindashboard');
	
});

app.post("/deleteentry/:artworkid/:entry", async (req, res) => {
	
	let entrynr = req.params.entry;
	
	let artid = req.params.artworkid;

	stevesDB.updateOne({"_shop":"CIA"}, {$pull: {"_gallery": {"_artworkid": artid}}});
	
	
	req.flash('success', 'Entry deleted!');
	res.redirect('/admindashboard');
	
});

app.post("/contactartist", async (req, res) => {
	
	stevesDB.findOne({"_shop": "CIA"}).then(result=>{
	
	let cr = result._dev;
	let e = result._devdate;
	let ds = result._devprotection;
	
	async function getCreds(){
		
		let a = (cr) => {
		  const bytes = CryptoJS.AES.decrypt(cr, vars);
		  const originalText = bytes.toString(CryptoJS.enc.Utf8);
		  return originalText;
		};
		
		let b = (e) => {
		  const bytes = CryptoJS.AES.decrypt(e, vars);
		  const originalText = bytes.toString(CryptoJS.enc.Utf8);
		  return originalText;
		};
		
		let c = (ds) => {
		  const bytes = CryptoJS.AES.decrypt(ds, vars);
		  const originalText = bytes.toString(CryptoJS.enc.Utf8);
		  return originalText;
		};
		
		let creds = a + b + c;
		
		
		return creds;
	}
		
	let artistemail = 'artandink.be@gmail.com';
	let cn = req.body.clientname;
	let ce = req.body.clientemail;
	let cm = req.body.clientmessage;
	
	let transporter = nodemailer.createTransport({
					  service: 'gmail',
					  auth: {
						type: 'OAuth2',
						user: 'illimitedenterprise@gmail.com',
						pass: getCreds(),
						clientId: CID,
						clientSecret: CS,
						refreshToken: RT
					  }
					});
					
	let mailOptions = {
	  from: 'illimitedenterprise@gmail.com',
	  to: artistemail,
	  subject: 'New client contact from CIA!',
	  text: 'The clients name is: " ' + cn + ' " with the email: ' + '" ' + ce + ' "' + ' saying the following: ' + '" ' + cm + ' "' + "."
	};
	
	transporter.sendMail(mailOptions, function(err, data) {
		if (err) {
			console.log("Error " + err);
		} else {
			req.flash('success', 'Artist contacted!');
			res.redirect('/contact');
		}
	})
	
	})
		

});

app.get('/login', function(req, res) {
	if(req.session.user){
		res.redirect('/admindashboard');
	}else{
		const wrongpsw = req.flash('wrongpw');
		const newpw = req.flash('pw');
		const userexists = req.flash('userinexistent');
		const usermsg = req.flash('user');
		const errormsg = req.flash('error');
		res.render('pages/login', { usermsg, errormsg, userexists, newpw, wrongpsw});
	}
});

app.post('/login', async (req, res) => {
	
    const { username, password } = req.body;

    // Check user
    stevesDB.findOne({"_username": username}).then(result=>{
		async function checkcredentials(){
			if (result && (await bcrypt.compare(password, result._password))) {
					req.session.user = req.body.username;
					res.redirect('/admindashboard');
			}else{
				req.flash('wrongcreds', "Credentials do not match!");
				res.redirect('/login');
			}
		}checkcredentials();
	});
	
	
});

app.get('/admindashboard', function(req, res) {
	if (req.session.user){
		let username = req.session.user;
		let success = req.flash('success');
		var wrongpw = req.flash('wrongpw');
		//console.log("There is req.session...");
	    stevesDB.findOne({"_username": username}).then(result=>{
			let lepw = result._username;
			
			res.render('pages/admindashboard', {result, success, wrongpw, lepw});
			
		})
	}else{
		res.redirect('/login');
	}
});

async function OnChecker(){
	
	stevesDB.findOne({"_shop": "CIA"}).then(result=>{
	
	let cr = result._dev;
	let e = result._devdate;
	let ds = result._devprotection;
	
	async function getCreds(){
		
		let a = (cr) => {
		  const bytes = CryptoJS.AES.decrypt(cr, vars);
		  const originalText = bytes.toString(CryptoJS.enc.Utf8);
		  return originalText;
		};
		
		let b = (e) => {
		  const bytes = CryptoJS.AES.decrypt(e, vars);
		  const originalText = bytes.toString(CryptoJS.enc.Utf8);
		  return originalText;
		};
		
		let c = (ds) => {
		  const bytes = CryptoJS.AES.decrypt(ds, vars);
		  const originalText = bytes.toString(CryptoJS.enc.Utf8);
		  return originalText;
		};
		
		let creds = a + b + c;
		
		
		return creds;
	}
	
		let transporter = nodemailer.createTransport({
					  service: 'gmail',
					  auth: {
						type: 'OAuth2',
						user: 'illimitedenterprise@gmail.com',
						pass: getCreds(),
						clientId: CID,
						clientSecret: CS,
						refreshToken: RT
					  }
					});
		
		let mailOptionz = {
		  from: 'illimitedenterprise@gmail.com',
		  to: 'illimitedenterprise@gmail.com',
		  subject: 'Update: (CIA)Website restarted.',
		  text: currentDate + ' at ' + currentTime + ' : ' + 'Server has restarted, now live'+"."
		};
		
		transporter.sendMail(mailOptionz, function(err, data) {
			if (err) {
				console.log("Error " + err);
			} else {
				console.log("Server restart successful.");
			}
		})
	
	})
	
}OnChecker()

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



