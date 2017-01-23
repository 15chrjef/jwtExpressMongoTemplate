var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');

var port = process.env.PORT || 8080;
mongoose.connect(config.database);
app.set('superSecretSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));


app.get('/setup', function(req, res) {
	var jeff = new User({
		name: 'Jeff Christian II',
		password: 'password',
		admin: true
	});

	jeff.save(function(err) {
		if(err) throw err;

		console.log('user saved!')
		res.json({ success: true });
	})
})




app.get('/', function(req, res) {
	res.send('we are at localhost' + port + '/api');
});

app.listen(port)
console.log('listening at localhost' + port )

var apiRoutes = express.Router();



apiRoutes.post('/authenticate', function(req,res) {
	User.findOne({
		name: req.body.name
	}, function(err, user) {
		if(err) throw err;

		if(!user) {
			res.json({ success: false, message: 'auth failed none found!'})
		} else if (user) {
			if(user.password !== req.body.password) {
				res.json({ success: false, message: 'auth failed!'})
			} else {
				var token = jwt.sign(user, app.get('superSecretSecret'), {
          expiresIn: 1440 * 60
				});

				res.json({
					success: true,
					message: 'token is here!',
					token: token
				})
			}
		}
	})
})

apiRoutes.use(function(req,res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	console.log('token', token)
	if(token) {
		jwt.verify(token, app.get('superSecretSecret'), function(err, decoded) {
			if(err) {
				return res.json({ success: false, message: 'Failed to authenticate token'});
			} else {
				req.decoded = decoded
				next();
			}
		})
	} else {
		return res.status(403).send({
			success: false,
			message: 'No token provided.'
		});
	}
});

apiRoutes.get('/', function(req, res) {
	res.json({ message: 'welcome to the api'});
})

apiRoutes.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});

app.use('/api', apiRoutes);

