const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 500 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  tags: [{ type: String }],
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
