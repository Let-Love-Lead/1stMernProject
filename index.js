const express = require('express');
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const { UserCollection, GoodsRequestCollection, ServiceRequestCollection, ApprovalCollection } = require('./mongodb');

const app = express();
const saltRounds = 10;
const templatesPath = path.join(__dirname, './templates');
const partialsPath = path.join(__dirname, './templates/partials');

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Replace with your secret key
    resave: false,
    saveUninitialized: true
}));

// View engine setup
app.set('view engine', 'hbs');
app.set('views', templatesPath);
hbs.registerPartials(partialsPath);

// Routes
app.get('/', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/home', (req, res) => {
    res.render('home', { loggedInUser: req.session.user });
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const user = await UserCollection.findOne({ name: req.body.name });
        if (!user) {
            console.log('User not found');
            return res.send('wrong details');
        }

        const passwordMatch = await bcrypt.compare(req.body.password, user.password);
        if (passwordMatch) {
            console.log('Password match:', user);
            req.session.user = user; // Store user in session after login
            res.render('home', { loggedInUser: user });
        } else {
            console.log('Password does not match');
            res.send('wrong password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('An error occurred during login.');
    }
});


//getting user data to feed good request form
app.get('/grequest', async (req, res) => {
    try {
        const users = await UserCollection.find({});
        res.render('grequest', {
            UserList: users,
            loggedInUser: req.session.user
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

//getting user data to feed service request form
app.get('/srequest', async (req, res) => {
    try {
        const users = await UserCollection.find({});
        res.render('srequest', {
            UserList: users,
            loggedInUser: req.session.user
        });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/approvals', (req, res) => {
    res.render('approvals', { loggedInUser: req.session.user });
});

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const data = {
            name: req.body.name,
            password: hashedPassword,
            department: req.body.department,
            email: req.body.email
        };
        await UserCollection.insertMany([data]);
        console.log('User signed up:', data);
        req.session.user = data; // Store user in session after signup
        res.render('home', { loggedInUser: data });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('An error occurred during signup.');
    }
});


// Route to render the userstable page with user data
app.get('/userstable', async (req, res) => {
    try {
        const users = await UserCollection.find({ $or: [{ role: 'None' }, { status: 'None' }] });
        res.render('userstable', { requests: users });
    } catch (error) {
        console.error('Failed to fetch requests:', error);
        res.status(500).send('Failed to fetch requests');
    }
});

// Route to get users with status
app.get('/usersWithStatus', async (req, res) => {
    try {
        const users = await UserCollection.find({ status: { $ne: 'None' } });
        res.json(users);
    } catch (error) {
        console.error('Failed to fetch users with status:', error);
        res.status(500).send('Failed to fetch users with status');
    }
});



// goods Request submission route
app.post("/grequest", (req, res) => {
    const { deptName, date, officerName, itemsToProcure } = req.body;
    const items = JSON.parse(itemsToProcure);
    const newRequest = new GoodsRequestCollection({
        deptName,
        date,
        officerName,
        itemsToProcure: items
    });

    newRequest.save()
        .then(() => res.status(200).json({ status: 'success', message: "Request submitted successfully"}))
        .catch((error) => res.status(500).json({status: 'error', message: "Failed to submit request: " + error.message}));
});

//service request submission route
app.post("/srequest", (req, res) => {
    const { deptName, date, officerName, itemsToProcure } = req.body;
    
    const newRequest = new ServiceRequestCollection({
        deptName,
        date,
        officerName,
        itemsToProcure // This should be a single string
    });

    newRequest.save()
        .then(() => res.status(200).json({ status: 'success', message: "Request submitted successfully" }))
        .catch((error) => res.status(500).json({ status: 'error', message: "Failed to submit request: " + error.message }));
});

// goods request itemstoprocureApproval
app.get("/goodsrApproval", async (req, res) => {
    try {
        const requests = await GoodsRequestCollection.find({});
        res.render('goodsrApproval', {
            requests: requests
        });
    } catch (error) {
        console.error('Failed to fetch requests:', error);
        res.status(500).send('Failed to fetch requests');
    }
});

//service request itemstoprocureApproval
app.get("/servicerApproval", async (req, res) => {
    try {
        const requests = await ServiceRequestCollection.find({});
        res.render('servicerApproval', {
            requests: requests
        });
    } catch (error) {
        console.error('Failed to fetch requests:', error);
        res.status(500).send('Failed to fetch requests');
    }
});

//request history fetching.
app.get("/reqHistory", async(req, res)=>{
    try{
        const requests = await ApprovalCollection.find({});
        res.render('reqHistory', {
            requests: requests
        });
    } catch(error) {
        console.error('Failed to fetch requests:', error);
        res.status(500).send('Faailed to fetch requests');
    }
});

// Route to update user role and status
app.post('/updateUserRoleAndStatus', async (req, res) => {
    try {
        const { userId, role, status } = req.body;
        await UserCollection.findByIdAndUpdate(userId, { role, status });
        res.status(200).send('User role and status updated successfully');
    } catch (error) {
        console.error('Failed to update user role and status:', error);
        res.status(500).send('Failed to update user role and status');
    }
});

// Route to submit approval and update users in UserCollection
app.post('/submitApproval', async (req, res) => {
    try {
        const { approvals } = req.body;
        for (const approval of approvals) {
            await UserCollection.findByIdAndUpdate(approval._id, { role: approval.role, status: approval.status });
        }
        res.status(200).send('Approval status submitted successfully');
    } catch (error) {
        console.error('Failed to submit approval status:', error);
        res.status(500).send('Failed to submit approval status');
    }
});
// Server setup
app.listen(3000, () => {
    console.log('Server is running on port 3000.');
});

