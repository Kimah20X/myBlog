const express = require("express");
const dotenv = require("dotenv");

const expressEjsLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
   
const app = express();
const PORT = process.env.PORT || 3030;
 
dotenv.config();

// Connect to MongoDB
const connectDB = require("./server/config/db");
connectDB();

// Setup view engine
app.use(expressEjsLayouts);
app.set("layout", "layouts/main"); 
app.set("layout", "layouts/admin");
app.set("view engine", "ejs");
//app.set("views", path.join(__dirname, "views")); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); 

// Cookie and session management
app.use(cookieParser());

app.use(
  session({
    secret: 'keyboard cat', // Used to sign session ID cookies
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI // MongoDB session store
    })
  })
); 

// Enable support for HTTP verbs like PUT and DELETE from forms
app.use(methodOverride('_method'));

// Custom helper to highlight active navigation links
const { isActiveRoute } = require('./server/helpers/routeHelpers');
app.locals.isActiveRoute = isActiveRoute;

app.use("/", require("./server/router/routes"));             
app.use("/", require("./server/router/admin")); 

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
