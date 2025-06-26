const express = require("express");
const Router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
const adminLayout = "../views/layouts/admin"; 

// check login
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Admin login page 
Router.get('/admin', async (req, res) => {
  try {
      const locals = {
        title: "Admin",
        description: "Simple Blog created with Node.js, Express & MongoDb."
      }

    res.render("admin/login", {locals, layout: adminLayout });
  } catch (error) {
    console.log(error)
  }
});


// Handle login POST
Router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }); 
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' }); 
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret );
    
    res.cookie('token', token, { httpOnly: true }); 
    res.redirect('/dashboard'); 

  } catch (error) {
    console.log(error);
  }
});

// Show registration page
Router.get('/register', (req, res) => {
  res.render('admin/register', {
    locals: { title: 'Admin Register' }
  });
});

// Handle user registration POST
Router.post('/register', async (req, res) => {
  res.render('admin/register');

  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, password:hashedPassword });
      res.status(201).json({ message: "User Created", user });
    } catch (error) {
      if(error.code === 11000) {
        res.status(409).json({ message: "User alrady in use"});
      }
      res.status(500).json({ message: "Internal Server error"})
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        res.render('admin/register', {
        locals: { title: 'Admin Register', message: 'User already exists' }
      });
    }

    res.redirect('/login');
  } catch (error) {
    console.error(error);
  }
});

// Admin dashboard 
Router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find();
    res.render('admin/dashboard', {
      locals: { title: 'Admin Dashboard' },
      data: posts,
      layout: adminLayout
    });
  } catch (error) {
    console.error(error);
  }
});

// Show add-post page
Router.get('/add-post', authMiddleware, (req, res) => {
try {
  res.render('admin/add-post', {
    locals: { title: 'Add Post' },
    layout: adminLayout
});

} catch (error) {
  console.log(error);
}
});

// add post 
Router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      body: req.body.body
    });
    await Post.create(newPost);
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
  }
});

// Show edit-post page
Router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const data = await Post.findOne({ _id: req.params.id });
    if (!data) return res.status(404).send("Post not found");

    res.render('admin/edit-post', {
      locals: { title: 'Edit Post' },
      data,
      layout: adminLayout
    });
  } catch (error) {
    console.error(error);
  }
});
  
//  update post (PUT)
Router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });
    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
    console.error(error);
  }
});

// delete post
Router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error); 
  }
});

// Logout - clear cookie and redirect home
Router.get('/logout', (req, res) => {
  res.clearCookie('token');
  // res.json({ message: "Logout Successful"})
  res.redirect('/');
});

module.exports = Router;
