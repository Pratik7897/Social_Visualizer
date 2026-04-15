/**
 * Seed Script - creates sample users, friendships, and posts
 * Run: node src/seed/seedData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const Post = require('../models/Post');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialconnect';

const users = [
  { username: 'alex_morgan', displayName: 'Alex Morgan', email: 'alex@example.com', password: 'password123', bio: 'Software engineer & coffee enthusiast ☕', occupation: 'Software Engineer', location: 'San Francisco, CA', interests: ['coding', 'coffee', 'hiking'] },
  { username: 'priya_sharma', displayName: 'Priya Sharma', email: 'priya@example.com', password: 'password123', bio: 'Product designer who loves minimal UI', occupation: 'UX Designer', location: 'New York, NY', interests: ['design', 'art', 'yoga'] },
  { username: 'james_ki', displayName: 'James Ki', email: 'james@example.com', password: 'password123', bio: 'CS student & open source contributor', occupation: 'Student', location: 'Austin, TX', interests: ['algorithms', 'gaming', 'music'] },
  { username: 'sofia_chen', displayName: 'Sofia Chen', email: 'sofia@example.com', password: 'password123', bio: 'Data scientist turning numbers into stories', occupation: 'Data Scientist', location: 'Seattle, WA', interests: ['ML', 'visualization', 'travel'] },
  { username: 'marcus_wade', displayName: 'Marcus Wade', email: 'marcus@example.com', password: 'password123', bio: 'Full stack dev & weekend photographer', occupation: 'Full Stack Developer', location: 'Chicago, IL', interests: ['photography', 'cycling', 'cooking'] },
  { username: 'layla_hassan', displayName: 'Layla Hassan', email: 'layla@example.com', password: 'password123', bio: 'AI researcher | coffee > tea', occupation: 'AI Researcher', location: 'Boston, MA', interests: ['AI', 'neuroscience', 'reading'] },
  { username: 'raj_patel', displayName: 'Raj Patel', email: 'raj@example.com', password: 'password123', bio: 'DevOps engineer making deployments painless', occupation: 'DevOps Engineer', location: 'Denver, CO', interests: ['cloud', 'automation', 'trekking'] },
  { username: 'nina_k', displayName: 'Nina Kovacs', email: 'nina@example.com', password: 'password123', bio: 'Frontend dev, CSS wizard, cat parent 🐱', occupation: 'Frontend Developer', location: 'Portland, OR', interests: ['CSS', 'animation', 'cats'] },
  { username: 'ben_okafor', displayName: 'Ben Okafor', email: 'ben@example.com', password: 'password123', bio: 'Backend engineer. Node.js fanatic.', occupation: 'Backend Engineer', location: 'Atlanta, GA', interests: ['Node.js', 'databases', 'basketball'] },
  { username: 'zoe_smith', displayName: 'Zoe Smith', email: 'zoe@example.com', password: 'password123', bio: 'Mobile dev building apps that spark joy', occupation: 'Mobile Developer', location: 'Miami, FL', interests: ['React Native', 'UX', 'surfing'] },
];

const postContents = [
  "Just shipped a feature using AVL trees for search indexing. O(log n) never felt so satisfying! 🌳",
  "Working on a graph visualization for social networks. BFS is genuinely fascinating once it clicks.",
  "Hot take: good variable names are worth 10x the time they take to write.",
  "Finally got my dev environment perfectly configured. Only took 3 days and my dignity.",
  "Reading about B-trees today. The self-balancing properties are elegant once you understand splits.",
  "Coffee shops ranked by Wi-Fi reliability > by coffee quality. Fight me.",
  "The difference between a junior and senior dev? Senior knows WHICH Stack Overflow post to copy.",
  "Pair programming session today — solved in 2 hours what I'd been stuck on for 2 days. Collaboration > solo.",
  "Depth-first search for debugging: go deep on one thread until you hit the bug. Works on code AND life.",
  "UI is done when users stop noticing it and just accomplish their goals.",
  "Graph theory has more real-world applications than any CS class made it seem.",
  "Shipping is a feature. Imperfect code that ships > perfect code in a PR.",
  "Hot take: design systems save more time than microservices architecture.",
  "First contribution to open source this week! Small fix, big feeling 🎉",
  "AVL vs Red-Black trees: AVL is faster for lookups, RB for insertions. Use the right tool.",
];

const friendshipPairs = [
  [0, 1], [0, 2], [0, 4], [1, 2], [1, 5],
  [2, 3], [2, 6], [3, 4], [3, 7], [4, 5],
  [4, 8], [5, 6], [6, 7], [6, 9], [7, 8],
  [8, 9], [1, 8], [0, 9], [3, 9], [2, 5]
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Friendship.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing data');

    // Create users (skip bcrypt pre-save by creating directly)
    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await User.create({ ...userData, password: hashedPassword });
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users`);

    // Create accepted friendships
    for (const [i, j] of friendshipPairs) {
      await Friendship.create({
        requester: createdUsers[i]._id,
        recipient: createdUsers[j]._id,
        status: 'accepted'
      });
    }
    console.log(`Created ${friendshipPairs.length} friendships`);

    // Update friend counts
    for (let i = 0; i < createdUsers.length; i++) {
      const count = friendshipPairs.filter(p => p[0] === i || p[1] === i).length;
      await User.findByIdAndUpdate(createdUsers[i]._id, { friendCount: count });
    }

    // Create posts
    let postIdx = 0;
    for (const user of createdUsers) {
      const numPosts = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < numPosts; k++) {
        await Post.create({
          author: user._id,
          content: postContents[postIdx % postContents.length],
          likeCount: Math.floor(Math.random() * 20)
        });
        postIdx++;
      }
    }
    const postCount = await Post.countDocuments();
    console.log(`Created ${postCount} posts`);

    // Update post counts
    for (const user of createdUsers) {
      const count = await Post.countDocuments({ author: user._id });
      await User.findByIdAndUpdate(user._id, { postCount: count });
    }

    console.log('\n✅ Seed complete!');
    console.log('Login with any user: email like alex@example.com, password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
