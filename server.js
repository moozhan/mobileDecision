if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
// const gameRoutes = require('./routes/gameRoutes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { requiresAuth } = require('express-openid-connect');
const User = require('./models/user');
const bodyParser = require('body-parser');
const GameData = require('./models/gamedata'); // Add this line to import your game data model

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'static')));
app.use('/scripts/Code', express.static(path.join(__dirname, 'scripts/Code')));
app.use(bodyParser.json({ 'limit': '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));


app.set('trust proxy', 1); // Trust first proxy
app.use(cors({
    origin: ['https://lazy-puce-tortoise-yoke.cyclic.app', 'https://moozhan.github.io', 'https://dev-backend.d4id81j7108zr.amplifyapp.com',
        'https://fourinarow.decisionmakingstyle.com', 'https://turk-dev.d4id81j7108zr.amplifyapp.com'], // Update with the location of your HTML file
    credentials: true
}));
app.use(cookieParser());

//============= MongoDB Setup ============//
const db = process.env.DB_CONNECTION;
const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
};
// Connect to MongoDB
mongoose
    .connect(db, options)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: db, // Your MongoDB connection string
        mongoOptions: options
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax' // Use 'None' for production, 'Lax' for development
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL
},
    function (accessToken, refreshToken, extraParams, profile, done) {
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});



// =================== All the Routes =======================//
// Route for serving the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/games/indecision', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'indecision.html'));
    } else {
        res.status(401).json({ error: 'User is not authenticated' });
    }
});

app.get('/playvscomp', (req, res) => {
    const username = req.query.username;
    if (username) {
        res.sendFile(path.join(__dirname, 'static', 'play_against_comp.html'));
    } else if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'static', 'play_against_comp.html'));
    } else {
        res.status(401).json({ error: 'User is not authenticated' });
    }
});
app.get('/games', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('collection.html');
    } else {
        res.status(401).json({ error: 'User is not authenticated' });
    }
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

// User data endpoint
// app.get('/user', (req, res) => {
//     if (req.isAuthenticated()) {
//         res.json({
//             id: req.user.id,
//             name: req.user.displayName,
//             emails: req.user.emails
//         });
//     } else {
//         res.status(401).json({ error: 'User is not authenticated' });
//     }
// });


//======================== All the forms ===============//
app.post('/games/indecision', (req, res) => {
    if (req.isAuthenticated()) {
        const indecision = [
            req.body.zero,
            req.body.one,
            req.body.two,
            req.body.three,
            req.body.four,
            req.body.five,
            req.body.six,
            req.body.seven,
            req.body.eight,
            req.body.nine,
            req.body.ten,
            req.body.eleven,
            req.body.twelve,
            req.body.thirteen,
            req.body.fourteen
        ]
        console.log(indecision);
        const id = req.user.id;
        User.updateOne({ auth0Id: id }, { $push: { "indecision": indecision } })
            .then(result => {
                console.log('Update successful', result);
                res.redirect('/games');
            })
            .catch(error => {
                console.error('Error updating user', error);
                res.redirect('/games/indecision');
            });
    } else {
        res.status(401).json({ error: 'User is not authenticated' });
    }
});

app.post('/userprofile', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const userDetails = {
                "strategic": req.body.strategic,
                "yearsofexperience": req.body.yearsofexperience,
                "training": req.body.training,
                "yearsoftraining": req.body.yearsoftraining,
                "location": req.body.location,
                "age": req.body.age,
                "gender": req.body.gender
            }
            const id = req.user.id;
            await User.updateOne({ auth0Id: id }, { $push: { "userdetails": userDetails } });
            console.log('Update successful');

            res.send('Profile updated successfully!'); // Respond to client on success
        } catch (error) {
            console.error('Error updating user', error);
            res.status(500).send('Error updating user details'); // Send error response
        }
    } else {
        res.status(401).send('User is not authenticated');
    }
});

app.post('/updateData', (req, res) => {
    if (req.isAuthenticated()) {
        console.log(JSON.parse(req.body.data));
        const id = req.user.id;
        User.updateOne({ auth0Id: id }, { $push: { "experiments": JSON.parse(req.body.data) } })
            .then(result => {
                console.log('Update successful', result);
                res.redirect('/games');
            })
            .catch(error => {
                console.error('Error updating user', error);
                res.redirect('/games');
            });
    } else {
        res.status(401).json({ error: 'User is not authenticated' });
    }
});

app.post('/save-game-data', (req, res) => {
    if (req.isAuthenticated()) {
        const allGamesData = req.body;

        const userId = req.user.id;

        User.updateOne({ auth0Id: userId }, { $push: { experiments: allGamesData } })
            .then(result => {
                console.log('Update successful', result);
                res.status(200).json({ message: 'Data saved successfully' });
            })
            .catch(error => {
                console.error('Error updating user', error);
                res.status(500).json({ error: 'Error updating user' });
            });
    } else {
        res.status(401).json({ error: 'User is not authenticated' });
    }
});

// Route to save game data for users playing without authentication
app.post('/save-game-data-no-auth', (req, res) => {
    const { username, gameData } = req.body;

    if (username && gameData) {
        const newGameData = new GameData({ username: username, data: gameData.games });
        newGameData.save()
            .then(result => {
                console.log('Game data saved successfully:', result);
                res.status(200).json({ message: 'Data saved successfully' });
            })
            .catch(error => {
                console.error('Error saving game data:', error);
                res.status(500).json({ error: 'Error saving game data' });
            });
    } else {
        res.status(400).json({ error: 'Username and game data are required' });
    }
});


//============================================== All Auth0 Routes
// Auth0 login route
app.get('/login', passport.authenticate('auth0', {
    scope: 'openid email profile'
}), (req, res) => {
    res.redirect('/callback');
});

app.get('/callback', passport.authenticate('auth0', { failureRedirect: '/login' }), async (req, res) => {
    try {
        console.log('User authenticated, checking if user exists in the database...');
        // Await the response from findOne to check if user already exists
        const existingUser = await User.findOne({ auth0Id: req.user.id });

        if (existingUser) {
            console.log('User exists, redirecting to /playvscomp');
            // User already exists, so redirect to the games page
            res.redirect('/playvscomp'); // Ensure this is the correct route
        } else {
            console.log('User does not exist, creating a new user...');
            // User does not exist, create a new user
            const newUser = new User({
                auth0Id: req.user.id
            });

            // Save the new user and then redirect
            await newUser.save();
            console.log('New user added:', newUser);
            res.redirect('/playvscomp'); // Ensure this is the correct route
        }
    } catch (err) {
        console.log('Error during user lookup or creation:', err);
        res.status(500).send('An error occurred during user processing');
    }
});

app.get('/logout', (req, res, next) => {
    if (req.isAuthenticated()) {
        req.logout(function (err) {
            if (err) { return next(err); }

            // Constructing the returnTo URL correctly
            let returnTo = `${req.protocol}://${req.hostname}`;
            const port = req.socket.localPort;
            if (process.env.NODE_ENV !== 'production' && port !== undefined && port !== 80 && port !== 443) {
                returnTo += `:${port}`;
            }

            const logoutURL = new URL(`https://${process.env.AUTH0_DOMAIN}/v2/logout`);
            const searchString = new URLSearchParams({
                client_id: process.env.AUTH0_CLIENT_ID,
                returnTo: returnTo
            });
            logoutURL.search = searchString.toString();

            console.log('Redirecting to Auth0 logout URL:', logoutURL.toString());
            res.redirect(logoutURL.toString());
        });
    } else {
        res.status(401).json({ error: 'User is not authenticated' });
    }
});







// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).send('Sorry, that route doesn\'t exist.');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Auth0 Domain:', process.env.AUTH0_DOMAIN);
console.log('Callback URL:', process.env.AUTH0_CALLBACK_URL);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
