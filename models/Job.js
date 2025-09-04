import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  postedBy: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
    required: [true, 'Job title is required.']
  },
  skills: {
    type: [String],
    required: [true, 'At least one skill is required.']
  },
  experience: String,
  contact: {
    type: String,
    required: [true, 'Contact number is required.']
  }
});

const Job = mongoose.model('Job', jobSchema);
export default Job;
