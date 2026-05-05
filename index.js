require('dotenv').config({ quiet: true })
const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
const connectDB = require('./config/db')
connectDB()
const model = require("./Model/admin");
const Student = require("./Model/student");

const bcrypt = require("bcryptjs");
const session = require("express-session");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Global Middleware for CDN handling
app.use((req, res, next) => {
  // Pass env variable to views
  res.locals.useCDN = process.env.NODE_ENV === 'production';
  // Default to not needing export libs unless specified by a route
  res.locals.needsExport = false;
  next();
});

app.set("view engine", "ejs");

const { MongoStore } = require("connect-mongo");

app.use(session({
  secret: process.env.KEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}));

function requireLogin(req, res, next) {
  if (!req.session.loggedIn) {
    return res.redirect("/");
  }
  next();
}

app.get("/", async (req, res) => {
  const allAdmins = await model.find({});
  res.render("index", { admins: allAdmins });
});

app.get("/AdminForm", (req, res) => {
  res.render("AdminForm");
});
app.get("/form", requireLogin, (req, res) => {
  res.render("AdminForm");
});

app.get("/dashboard", requireLogin, (req, res) => {
  res.render("Dashboard");
});

app.get("/studentsform", requireLogin, (req, res) => {
  res.render("StudentsForm");
});

app.get("/studentsEditform", requireLogin, (req, res) => {
  res.render("StudentsForm");
});

app.get("/StudentsTable", requireLogin, async (req, res) => {
  const allStudents = await Student.find({});
  res.locals.needsExport = true;
  res.render("StudentsTable", { students: allStudents });
});

app.get("/AdminTable", requireLogin, async (req, res) => {
  const allAdmins = await model.find({});
  res.render("AdminTable", { admins: allAdmins });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.post("/form", async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.send("Passwords do not match");
    }

    const existingAdmin = await model.findOne({ email });
    if (existingAdmin) {
      return res.send("Admin with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await new model({
      fullName,
      email,
      password: hashedPassword,
    }).save();

    res.redirect("/AdminTable");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating admin");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await model.findOne({ email });

    if (!admin) return res.send("Admin not found");

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.send("Invalid password");

    req.session.loggedIn = true;
    req.session.userId = admin._id;

    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/studentsForm", requireLogin, async (req, res) => {
  try {
    const {
      name,
      fatherName,
      motherName,
      gender,
      address,
      phone,
      email,
      centre,
      course,
      receiptNo,
      totalFees,
      collectedFees,
      courseStart,
      qualification,
      dateOfBirth,
      enrollmentType,
    } = req.body;

    const remainingFees = totalFees - collectedFees;

    const newStudent = new Student({
      name,
      fatherName,
      motherName,
      gender,
      address,
      dob: dateOfBirth, // Sync dob with dateOfBirth
      phone,
      email,
      centre,
      course,
      receiptNo,
      totalFees,
      collectedFees,
      remainingFees,
      courseStart,
      qualification,
      dateOfBirth,
      enrollmentType,
    });

    await newStudent.save();
    res.redirect("/StudentsTable");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error saving student");
  }
});

app.get("/viewStudent/:id", requireLogin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.send("Student not found");

    res.render("StudentView", { student });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading student");
  }
});


app.get("/delete/:id", requireLogin, async (req, res) => {
  await model.findByIdAndDelete(req.params.id);
  res.redirect("/AdminTable");
});

app.get("/edit/:id", requireLogin, async (req, res) => {
  const editUser = await model.findById(req.params.id);
  res.render("AdminEditForm", { admin: editUser });
});

app.get("/deleteStudent/:id", requireLogin, async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect("/StudentsTable");
});

app.get("/editStudent/:id", requireLogin, async (req, res) => {
  const editStudent = await Student.findById(req.params.id);
  res.render("StudentsEditForm", { student: editStudent });
});

app.post("/update/:id", async (req, res) => {
  try {
    const {
      UpdateName,
      Updateemail,
      Updatepassword,
      UpdateconfirmPassword,
    } = req.body;

    let updatedData = {
      fullName: UpdateName,
      email: Updateemail,
    };

    if (Updatepassword) {
      if (Updatepassword !== UpdateconfirmPassword) {
        return res.send("Passwords do not match");
      }
      updatedData.password = await bcrypt.hash(Updatepassword, 10);
    }

    await model.findByIdAndUpdate(req.params.id, updatedData);
    res.redirect("/AdminTable");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/UpdatestudentsForm/:id", requireLogin, async (req, res) => {
  try {
    const updatedData = {
      name: req.body.name,
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      gender: req.body.gender,
      address: req.body.address,
      dob: req.body.dateOfBirth, // Sync dob with dateOfBirth
      phone: req.body.phone,
      email: req.body.email,
      course: req.body.course,
      centre: req.body.centre,
      receiptNo: req.body.receiptNo,
      totalFees: req.body.totalFees,
      collectedFees: req.body.collectedFees,
      remainingFees: req.body.remainingFees,
      courseStart: req.body.courseStart,
      qualification: req.body.qualification,
      dateOfBirth: req.body.dateOfBirth,
      enrollmentType: req.body.enrollmentType,
    };

    await Student.findByIdAndUpdate(req.params.id, updatedData);
    res.redirect("/StudentsTable");
  } catch (error) {
    console.log("Error updating student:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/PrintStudent/:id", requireLogin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.send("Student not found");

    res.render("PrintStudent", { student });
  } catch (error) {
    console.log(error);
    res.send("Error printing student");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});