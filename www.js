const   express = require("express"),
		bodyparser = require("body-parser"),
		timeout = require("connect-timeout"),
		morgan = require("morgan"),
		helmet = require("helmet"),
		compression = require("compression"),
		routes = require("./../routes/routes"),
		fs = require("fs"),
		path = require("path"),
		rfs = require("rotating-file-stream"),
		app = express(),
		passport = require("./../conf/passport_config"),
		_ = require("lodash"),
		www = require("commander"),
		halt = (req,res,next)=>{ 
			if(!req.timedout) {next();} 
		};

// Define parameters for the www/bin.
www.version("0.0.1")
	.option("--port [port]", "Specify the port that the application should run on.", process.env.PORT || 3000)
	.option("--usedomain [usedomain]", "Specify the domain the server should be bound to", process.env.DOMAIN || "localhost")
	.option("--urlencoding [extended]","Sets body-parser to use URLencoding option.","")
	.option("--json","Sets body-parser to use JSON option.",false)
	.option("--jsontype [type]","Sets any custom JSON types required for the body-parser json call","None")
	.option("--dnsprefetch","Whether to control prefetch",true)
	.option("--nocache","Whether to control client-side caching",true)
	.option("--nosniff","Whether to allow client to sniff MIME type",true)
	.option("--xssfilter","Whether to add xss protections",true)
	.option("--hidepoweredby","Whether to hide what this is powered by.",true)
	.option("--timeout [time]","Set the timeout interval for requests.","60s")
	.option("--referrertype [type]","Sets the referrer type for referrer policy","same-origin")
	.option("--logging","Enable logging",true)
	.option("--logtype [type]","Sets the type of logging required. Logging must be enabled for this to work.","file")
	.option("--compression","Enable compression",true)
	.parse(process.argv);

// Timeout 
app.use(timeout(www.timeout));

// Compression
if(www.compression)
	app.use(compression());

// Logging
if(www.logging) {
	if(logtype == "file") { 
		// Add to log folder
		var logDirectory = path.join(__dirname, 'log');

		// ensure log directory exists
		fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

		// create a rotating write stream
		var accessLogStream = rfs('access.log', {
			interval: '1d', // rotate daily
			path: logDirectory
		});

		// setup the logger
		app.use(morgan('combined', {stream: accessLogStream}));
	} else { 
		app.use(morgan("combined"));
	}
}


// Body-parser urlencoding support
if(!_.isNil(www.urlencoding))
	app.use(bodyparser.urlencoded({extended: www.urlencoding == "extended"}));

// Halt after each
app.use(halt);

// Body-parser json support
if(www.json) 
	app.use(bodyparser.json(www.jsontype == "None" ? {} : {type: www.jsontype}));

// Halt again
app.use(halt);

// Enable helmet for security.
app.use(helmet({
	dnsPrefetchControl: www.dnsprefetch,
	noCache: www.nocache,
	noSniff: www.nosniff,
	xssFilter: www.xssfilter,
	hidePoweredBy: www.hidepoweredby
}));

app.use(helmet.referrerPolicy(www.referrerpolicy));

app.use(halt);

// Development-only options
if(process.env.NODE_ENV == "development") { 
	app.use(errorhandler());
	app.use(halt);
}

// Listen, finally!
app.listen(parseInt(www.port),www.usedomain,()=>{
	console.log(`HTTP server started, listening on ${www.usedomain}:${www.port}`)
});
