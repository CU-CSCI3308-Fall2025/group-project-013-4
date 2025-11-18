const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { requireEnv } = require("./utils/env");
const sessionSecret = requireEnv("SESSION_SECRET");
const jwtSecret = requireEnv("JWT_SECRET");

// DB connection
const pool = require("./config/db");

// Middleware
const protect = require("./middleware/protect");

// Modules (each contains its own routes + controller logic)
const authModule = require("./modules/auth");
const friendsModule = require("./modules/friends");
const postsModule = require("./modules/posts");
const transactionsModule = require("./modules/transactions");
const pagesModule = require("./modules/pages");
const budgetModule = require("./modules/budget");

const app = express();

/* --------------------------------------------
   VIEW ENGINE SETUP
--------------------------------------------- */
const hbs = exphbs.create({
  extname: "hbs",
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "views", "layouts"),
  partialsDir: path.join(__dirname, "views", "partials"),
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

/* --------------------------------------------
   MIDDLEWARE
--------------------------------------------- */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: sessionSecret,
    saveUninitialized: false,
    resave: false,
  })
);

// Static resources (CSS, JS, uploads)
app.use("/resources", express.static(path.join(__dirname, "resources")));

/* --------------------------------------------
   SHARED USER EXTRACTION (res.locals.user)
--------------------------------------------- */
app.use(async (req, res, next) => {
  res.locals.user = null;
  res.locals.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

  try {
    const token = req.session.token;
    if (!token) return next();

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, jwtSecret);

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      decoded.id,
    ]);

    if (result.rows.length > 0) {
      res.locals.user = result.rows[0];
    }
  } catch (err) {
    res.locals.user = null;
  }

  next();
});

/* --------------------------------------------
   ROUTES
--------------------------------------------- */

// WEB PAGE ROUTES (home, login, register, settings, etc.)
app.use("/", pagesModule);

// AUTH
app.use("/api/auth", authModule);

// FRIENDS
app.use("/api/friends", friendsModule);

// POSTS
app.use("/api/posts", postsModule);

// TRANSACTIONS
app.use("/api/transactions", transactionsModule);

// LEADERBOARD
app.use("/api/leaderboard", require("./modules/leaderboard"));
// BUDGETS
app.use("/api/budgets", budgetModule);

/* --------------------------------------------
   DEBUG (optional)
--------------------------------------------- */
console.log("Registered routes:");
app._router.stack
  .filter((r) => r.route)
  .map((r) =>
    console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`)
  );

/* --------------------------------------------
   START SERVER
--------------------------------------------- */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () =>
  console.log(`🚀 Server is listening on port ${PORT}`)
);

module.exports = server;
