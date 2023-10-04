const express= require ('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {model, mongo} = require('mongoose');
const app= express();
app.use(cors());
app.use(express.json());


const SECRET ='S3CR3T';
const userSchema= new mongoose.Schema({
   username: String,
   password: String,
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});


const adminSchema= new mongoose.Schema({
    username: String,
    password: String
});

const courseSchema=new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    image: String,
    purchased: Boolean
});

const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};
mongoose.connect('',{ useNewUrlParser: true, useUnifiedTopology: true, dbName: "courses" }); //Put your MongoDB conncetion string

app.get('/admin/me', authenticateJwt,(req,res)=>{
    res.json({
        username: req.user.username
    })
})

app.post('/admin/signup', (req, res) => {
    const { username, password } = req.body;
    function callback(admin) {
        if (admin) {
            res.status(403).json({ message: 'Admin already exists' });
        } else {
            const obj = { username: username, password: password };
            const newAdmin = new Admin(obj);
            newAdmin.save();
            const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' });
            res.json({ message: 'Admin created successfully', token });
        }

    }
    Admin.findOne({ username }).then(callback);
});

app.post('/admin/login',async(req,res)=>{
    const {username, password}= req.headers;
    const admin = await Admin.findOne({username, password});
    if(admin){
        const token= jwt.sign({username, role:'admin'}, SECRET, {expiresIn: '2h'});
        res.json({message: 'Admin logged in', token});
    }else{
        res.status(403).json({message:'Invalid credentials'});
    }
});

app.post('/admin/addCourse',authenticateJwt, async(req,res)=>{
    const course= new Course(req.body);
    await course.save();
    res.json({message: 'Course added successfully', courseId: course.id});
    console.log(courseId);
});

app.put('/admin/courses/:courseId',authenticateJwt, async (req,rea)=>{
    const course= await findByIdAndUpdate(req.params.courseId, req.body,{new: true});
    if(course){
        res.json({message: 'Course updated successfully'});
    }
    else{
        res.status(404).json({message: 'Course not found'});
    }
});

app.get('/admin/courses',authenticateJwt, async (req,res)=>{
    const courses= await Course.find();
    res.json({courses});
});

app.get('/admin/courses/:courseId',authenticateJwt, async (req,res)=>{
    const courseId= req.params.courseId;
    const course= await Course.findById(courseId);
    res.json({course});
});

app.post('/user/signup',async(req,res)=>{
    const {username,password}= req.headers;
    const user = await User.findOne({username});
    if(user){
        res.status(403).json({message:"User already exists"});
    }else{
        const obj={username: username, password: password};
        const newUser= new User(obj);
        await newUser.save();
        const token=jwt.sign({username, role:'user'},SECRET,{expiresIn:'2h'});
        res.json({message:'User created', token});
    }
});

app.post('/user/login',async(req,res)=>{
    const {username,password}= req.headers;
    const user= await User.findOne({username,password});
    if(user){
    const token= jwt.sign({username, role:'user'}, SECRET, {expiresIn: '2h'});
    res.json({message: 'User logged in', token});
    }
});

app.get('/user/me', authenticateJwt, async (req,res)=>{
   const courses= await Course.find({purchased: true});
    res.json({courses});
});
app.listen(3000, () => console.log('Server running on port 3000'));

