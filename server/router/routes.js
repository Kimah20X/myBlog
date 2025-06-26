const express = require("express");
const Router = express.Router();
const Post = require('../models/post');
const mainLayout = "../views/layouts/main";
// Home page route
Router.get('/', async (req, res) => {
    try {
        const locals = { 
            title: "Blog",
            description: "Simple Blog created with Node.js, Express & MongoDb." 
        }

        // Pagination variables 
        let perPage = 10; 
        let page = req.query.page || 1; 

        // Fetch data using Mongoose aggregation for pagination 
        const data = await Post.aggregate([ { $sort: { createdAt: -1 } } ])
        .skip(perPage * page - perPage)
        .limit(perPage) 
        .exec(); 
 
        // Count total number of posts for pagination calculation 
        const count = await Post.count;

        // Calculate next page and whether a next page exists 
        const nextPage = parseInt(page) + 1; 
        const hasNextPage = nextPage <= Math.ceil(count / perPage); 
                res.render('index', { 
                    locals,
                    data, 
                    currentPage: page, 
                    nextPage: hasNextPage ? nextPage : null
                });
            } catch (error) {
                console.log(error); 
            }
        });

// route for each post
Router.get('/posts/:id', async (req, res) => {
    try {
        let slug = req.params.id;

        const data = await Post.findById({ _id: slug });
        
        const locals = { 
            title: data.title,
            description: "Simple Blog created with Node.js, Express & MongoDb.",
            currentroute: `/post/${slug}`
        }
        res.render("post", {locals, data});
    } catch (error) {
        console.log(error);
    }
});

// get posts
Router.get('/post', async (req, res) => {
    try {
        const locals = { 
            title: "Posts - Node.js Block",
            description: "List of all posts"
        };
        // Fetch all posts
        const data = await Post.find().sort({ createdAt: -1 });

        res.render('post', { locals, data });
    } catch (error) {
        console.log(error);
    }
});

// Contact page route
Router.get('/contact', (req, res) => {
    const locals = { 
        title: "Contact - Node.js Block",
        description: "Get in touch with us"
    };
    res.render('contact', { locals }); 
});

// About page route
Router.get('/about', (req, res) => {
    const locals = { 
        title: "About - Node.js Block",
        description: "Learn more about this node.js block project"
    };
    res.render('about', { currentroute: "/about" }); 
});

Router.post('/search', async (req, res) => {
     try {
        const locals = { 
            title: "search",
            description: "Simple Blog created with Node.js, Express & MongoDb." 
        }
        
        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "")
        
        const data = await Post.find({
            $or:[
                { title: { $regex: new RegExp(searchNoSpecialChar, "1") }},
                { body: { $regex: new RegExp(searchNoSpecialChar, "1") }}
            ]
        })
        res.render("search", {
            data, 
            locals
        });
    } catch (error) {
        console.log(error);
    }
});


module.exports = Router;
