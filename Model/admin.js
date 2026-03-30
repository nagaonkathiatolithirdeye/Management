const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    confirmPassword: String,
});
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;