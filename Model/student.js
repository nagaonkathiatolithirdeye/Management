const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: String,
    fatherName: String,
    motherName: String,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    centre: {
      type: String,
      enum: ["Kathiatoli","Nagaon"],
      required: true,
    },
    address: String,
    dob: String,
    qualification: String,
    dateOfBirth: Date,
    enrollmentType: {
      type: String,
      enum: ["online", "offline"],
      default: "offline"
    },
    phone: String,
    email: String,
    course: String,
    receiptNo: String,
    totalFees: Number,
    collectedFees: Number,
    remainingFees: Number,
    courseStart: String,
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
