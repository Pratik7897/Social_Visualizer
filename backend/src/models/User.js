const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
  displayName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  bio: { type: String, maxlength: 200, default: '' },
  avatar: { type: String, default: '' },
  location: { type: String, default: '' },
  occupation: { type: String, default: '' },
  interests: [{ type: String }],
  friendCount: { type: Number, default: 0 },
  postCount: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  return {
    _id: this._id,
    username: this.username,
    displayName: this.displayName,
    bio: this.bio,
    avatar: this.avatar,
    location: this.location,
    occupation: this.occupation,
    interests: this.interests,
    friendCount: this.friendCount,
    postCount: this.postCount,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
