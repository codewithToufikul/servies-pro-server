const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Server } = require('socket.io');
const http = require('http');
const transporter = require('./emailConfig');
const crypto = require('crypto');


app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://www.servicepro24x7.com'
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
const server = http.createServer(app);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ivo4yuq.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let services;


async function run() {
  try {
    await client.connect();
    const db = client.db("serviesPro");
    services = db.collection("servieses");
    latestWork = db.collection("latestWork");
    statusCollection = db.collection("status");
    faq = db.collection("faq");
    usersCollection = db.collection("users");
    paymentsCollection = db.collection("payments");
    feedbackCollection = db.collection("feedback");
    messagesCollection = db.collection("messages");
    blogsCollection = db.collection("blogs");

    console.log("Connected to MongoDB");

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

run();

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

app.get('/me',  async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      userId: user._id,
      name: user.name,
      email: user.username,
      number: user?.number,
      profileImage: user?.profileImage,
      role: user?.role,
      moderatorRole: user?.moderatorRole,
    });
  } catch (error) {
    console.error("JWT Verification Error:", error);
    res.status(401).json({ error: "Invalid or expired token." });
  }
});


app.post('/register', async (req, res) => {
  const { name, username, password } = req.body;

  const existingUser = await usersCollection.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const newUser = {
    name,
    username,
    password: hashedPassword,
    isVerified: false,
    verificationToken,
  };

  const result = await usersCollection.insertOne(newUser);

  const verificationLink = `https://www.servicepro24x7.com/verify-email?token=${verificationToken}&email=${username}`;

  await transporter.sendMail({
    from: '"Service Pro" servicepro24x@gmail.com',
    to: username, // assuming username is the email
    subject: 'Welcome to Service Pro - Confirm your email address',
    html: `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

      body {
        font-family: "Poppins", Arial, sans-serif;
        line-height: 1.6;
        color: #333333;
        margin: 0;
        padding: 0;
        background-color: #f7f9fc;
        -webkit-font-smoothing: antialiased;
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      }

      .email-header {
        background: linear-gradient(135deg, #4f46e5, #7e3af2);
        padding: 30px 20px;
        text-align: center;
      }

      .logo {
        margin-bottom: 15px;
        width: 50px;
        height: auto;
      }

      .email-header h1 {
        color: #ffffff;
        font-weight: 600;
        margin: 0;
        font-size: 24px;
        letter-spacing: 0.5px;
      }

      .email-body {
        padding: 40px 30px;
        background-color: #ffffff;
        text-align: center;
      }

      .icon-container {
        margin-bottom: 25px;
      }

      .icon-circle {
        width: 80px;
        height: 80px;
        background-color: #f0f4ff;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      }

      .email-body h2 {
        color: #303441;
        font-size: 22px;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 15px;
      }

      .email-body p {
        color: #64748b;
        font-size: 16px;
        margin-bottom: 25px;
        padding: 0 15px;
      }

      .btn {
        display: inline-block;
        padding: 14px 36px;
        background-color: #4f46e5;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 16px;
        transition: background-color 0.2s ease;
      }

      .btn:hover {
        background-color: #4338ca;
      }

      .fallback {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }

      .fallback p {
        font-size: 13px;
        color: #94a3b8;
      }

      .fallback a {
        color: #4f46e5;
        word-break: break-all;
        font-size: 13px;
      }

      .email-footer {
        background-color: #f8fafc;
        padding: 25px 20px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }

      .email-footer p {
        color: #94a3b8;
        font-size: 14px;
        margin: 5px 0;
      }

      .social-icons {
        margin: 15px 0;
      }

      .social-icon {
        display: inline-block;
        margin: 0 8px;
      }

      .social-icon img {
        width: 24px;
        height: 24px;
        opacity: 0.7;
      }

      @media screen and (max-width: 600px) {
        .email-body {
          padding: 30px 20px;
        }

        .email-header h1 {
          font-size: 22px;
        }

        .email-body h2 {
          font-size: 20px;
        }

        .email-body p {
          font-size: 15px;
        }

        .btn {
          padding: 12px 28px;
          font-size: 15px;
          color: white;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Email Header -->
      <div class="email-header">
        <h1>Verify Your Email Address</h1>
      </div>

      <!-- Email Body -->
      <div class="email-body">
        <div class="icon-container">
          <div class="icon-circle">
                <img src="https://i.ibb.co/TDx0m462/verified.png" alt="">
          </div>
        </div>

        <h2>Thanks for signing up!</h2>
        <p>
          We're excited to have you get started. First, you need to verify your
          email address by clicking the button below.
        </p>

        <a  href="${verificationLink}" style="color: #ffffff; text-decoration: none;"  class="btn">Verify Email Address</a>

        <div class="fallback">
          <p>
            If the button above doesn't work, you can also click on the link
            below:
          </p>
          <a href="${verificationLink}">${verificationLink}</a>
        </div>
      </div>

      <!-- Email Footer -->
      <div class="email-footer">
        <p>© 2025 Service Pro. All rights reserved.</p>
        <p>North Zone B, LP 80/2, Road No. 276, <br>
            Khalishpur, Khulna</p>
        <p>
          <a
            href="#"
            style="color: #94a3b8; text-decoration: none; margin: 0 5px"
            >Unsubscribe</a
          >
          |
          <a
            href="#"
            style="color: #94a3b8; text-decoration: none; margin: 0 5px"
            >Privacy Policy</a
          >
        </p>
      </div>
    </div>
  </body>
</html>

    `
  });

  res.send({ success: true, message: 'User registered. Please verify your email.', userId: result.insertedId });
});

app.get('/verify-email', async (req, res) => {
  const { token, email } = req.query;
console.log(token, email)
  const user = await usersCollection.findOne({ username: email.trim() });

  if (!user) {
    return res.status(400).send('User not found');
  }

  console.log("DB token:", user.verificationToken);
  console.log("Query token:", token);
  console.log("Match:", user.verificationToken === token);

  if (user.verificationToken !== token) {
    return res.status(400).send('Invalid or expired verification link.');
  }

  await usersCollection.updateOne(
    { username: email.trim() },
    {
      $set: { isVerified: true },
    }
  );

  res.send('Email verified successfully!');
});



// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await usersCollection.findOne({ username });
  if (!user || user.isVerified !== true) return res.status(401).json({ message: 'You need to verify your account !' });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user._id, name: user.name, username: user.username, profileImage: user.profileImage },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Check if the email exists
  const user = await usersCollection.findOne({ username: email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate a reset password token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetLink = `https://www.servicepro24x7.com/reset-password?token=${resetToken}&email=${email}`;

  // Save the reset token in the user's record
  await usersCollection.updateOne(
    { username: email },
    { $set: { resetToken } }
  );

  // Send the reset link via email
  await transporter.sendMail({
    from: '"Service Pro" servicepro24x@gmail.com',
    to: email,
    subject: 'Reset your password',
    html: `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eaeaea;
        }
        .logo {
            height: 60px;
            width: auto;
            margin-bottom: 15px;
            background-color: #4285f4;
            border-radius: 50%;
            display: inline-block;
            padding: 15px;
        }
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
        }
        p {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            padding: 12px 28px;
            background-color: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #3367d6;
        }
        .expiry {
            font-size: 14px;
            color: #757575;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            color: #757575;
            font-size: 12px;
        }
        .help {
            margin-top: 30px;
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            text-align: left;
        }
        .social {
            margin-top: 20px;
        }
        .social a {
            display: inline-block;
            margin: 0 10px;
            color: #757575;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Service Pro</h2>
        </div>
        
        <div class="content">
            <h1>Reset Your Password</h1>
            <p>We received a request to reset your password. Don't worry, we're here to help!</p>
            <p>Click the button below to set a new password for your account. This link is valid for the next 24 hours.</p>
            
            <a href="${resetLink}" style="color: #ffffff; text-decoration: none;" class="btn">Reset Password</a>
            
            <p class="expiry">If you didn't request a password reset, you can safely ignore this email. Your account security is important to us.</p>
            
            <div class="help">
                <p><strong>Having trouble?</strong> If the button above doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 12px; color: #4285f4;">${resetLink}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 Service Pro. All rights reserved.</p>
            <p>Our mailing address: North Zone B, LP 80/2, Road No. 276,
              Khalishpur, Khulna</p>
            <div class="social">
                <a href="#">Privacy Policy</a> | 
                <a href="#">Terms of Service</a> | 
                <a href="#">Contact Support</a>
            </div>
        </div>
    </div>
</body>
</html>
    `
  });

  res.json({ message: 'Password reset link sent to email' });
});


app.post('/reset-password', async (req, res) => {
  const { token, email, newPassword } = req.body;

  // Check if the token and email match
  const user = await usersCollection.findOne({ username: email, resetToken: token });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password and remove the reset token
  await usersCollection.updateOne(
    { username: email },
    {
      $set: { password: hashedPassword },
      $unset: { resetToken: "" }
    }
  );

  res.json({ message: 'Password reset successfully' });
});



app.get("/services", async (req, res) => {
  try {
    const cursor = services.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.post("/services", async (req, res) => {
  try {
    const newService = req.body;
    const result = await services.insertOne(newService);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to add service", details: error.message });
  }
});

app.get("/services/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await services.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch service", details: error.message });
  }
});

app.delete("/services/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const result = await services.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to delete service", details: error.message });
  }
});

app.put("/services/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const editData = req.body;
    const result = await services.updateOne(
      { _id: new ObjectId(id) },
      { $set: editData }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to update service", details: error.message });
  }
});

app.get("/latestWork", async (req, res) => {
  try {
    const cursor = latestWork.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.post("/latestWork", async (req, res) => {
  try {
    const newWork = req.body; // should include title, description, link, image
    const result = await latestWork.insertOne(newWork);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({
      error: "Failed to add project",
      details: error.message,
    });
  }
});


app.patch("/latestWork/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description } = req.body;

    const result = await latestWork.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, description } }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      error: "Failed to update project",
      details: error.message,
    });
  }
});

app.delete("/latestWork/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await latestWork.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({
      error: "Failed to delete project",
      details: error.message,
    });
  }
});


app.get("/status", async (req, res) => {
  try {
    const cursor = statusCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.put("/status/increment/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Ensure we're using a valid ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).send({ error: "Invalid ID format" });
    }
    
    // First get the current document to access the count value
    const item = await statusCollection.findOne({ _id: objectId });
    
    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }
    
    // Convert string count to number and increment
    const currentCount = parseInt(item.count) || 0;
    const newCount = currentCount + 1;
    
    // Update with the new count value
    const result = await statusCollection.updateOne(
      { _id: objectId },
      { $set: { count: newCount } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).send({ error: "Count not updated" });
    }
    
    res.send({ success: true, message: "Count incremented successfully" });
  } catch (error) {
    console.error("Error incrementing count:", error);
    res.status(500).send({ error: "Failed to increment count", details: error.message });
  }
});

// Decrement endpoint
app.put("/status/decrement/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Ensure we're using a valid ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).send({ error: "Invalid ID format" });
    }
    
    // Find the item first to check its count
    const item = await statusCollection.findOne({ _id: objectId });
    
    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }
    
    // Convert string count to number
    const currentCount = parseInt(item.count) || 0;
    
    if (currentCount <= 0) {
      return res.status(400).send({ error: "Count cannot be negative" });
    }
    
    const newCount = currentCount - 1;
    
    // Update with the new count value
    const result = await statusCollection.updateOne(
      { _id: objectId },
      { $set: { count: newCount } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).send({ error: "Count not updated" });
    }
    
    res.send({ success: true, message: "Count decremented successfully" });
  } catch (error) {
    console.error("Error decrementing count:", error);
    res.status(500).send({ error: "Failed to decrement count", details: error.message });
  }
});



app.get("/faq", async (req, res) => {
  try {
    const cursor = faq.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch services", details: error.message });
  }
});

app.post('/faq', async (req, res) => {
  const newFaq = req.body
  try {
    const result = await faq.insertOne(newFaq)
    res.send(result)
  } catch (err) {
    res.status(500).send({ error: 'Failed to add FAQ' })
  }
})

app.delete('/faq/:id', async (req, res) => {
  const id = req.params.id
  try {
    const result = await faq.deleteOne({ _id: new ObjectId(id) })
    res.send(result)
  } catch (err) {
    res.status(500).send({ error: 'Failed to delete FAQ' })
  }
})


// Payment Intent route
app.post('/create-payment-intent', async (req, res) => {
  const { price, serviceId, userId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100, // amount in cents
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


app.post("/payment-success", async (req, res) => {
  const { userId, userName, userProfileImage, serviceName, serviceId, amount, transactionId, status, orderStatus } = req.body;

  if (status !== "succeeded") {
    return res.status(400).send({ success: false, message: "Payment not successful" });
  }

  const paymentDoc = {
    userId,
    userName,
    userProfileImage,
    serviceId,
    serviceName,
    amount,
    transactionId,
    status,
    date: new Date(),
    method: "stripe",
    orderStatus,
  };

  try {
    const result = await paymentsCollection.insertOne(paymentDoc);
    res.send({ success: true, message: "Payment recorded", result });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

app.post("/api/feedback", async (req, res) => {
  const formData = req.body;
  console.log(formData);
  try {
    const result = await feedbackCollection.insertOne(formData);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to add feedback", details: error.message });
  }
});

app.get("/feedback", async (req, res) => {
  try {
    const cursor = feedbackCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch feedback", details: error.message });
  }
});

app.patch("/feedback/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).send({ error: "Status is required" });
  }

  try {
    const result = await feedbackCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ error: "Feedback not found or status unchanged" });
    }

    res.send({ message: "Feedback status updated", result });
  } catch (error) {
    res.status(500).send({ error: "Failed to update status", details: error.message });
  }
});


app.get("/payment-history/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    // Correct MongoDB query
    const result = await paymentsCollection.find({ userId: userId }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/payment-history", async (req, res) => {
  try {
    // Correct MongoDB query
    const result = await paymentsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


app.patch("/update-order-status/:id", async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;

  try {

    const result = await paymentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { orderStatus: newStatus } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.send({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


app.post('/update-profile-image', async (req, res) => {
  const { userId, profileImage } = req.body;

  if (!userId || !profileImage) {
    return res.status(400).json({ message: 'Missing userId or profileImage' });
  }

  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profileImage } }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true, message: 'Profile image updated' });
    } else {
      res.status(404).json({ success: false, message: 'User not found or image not updated' });
    }
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.patch('/update-profile',  async (req, res) => {
  const { userId, name, username, number } = req.body;
console.log( userId, name, username, number )
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name,
          username, // Replace email field
          number,
        },
      }
    );
    if (result.modifiedCount > 0) {
      res.send({ success: true });
    } else {
      res.status(400).send({ success: false, message: "No changes made" });
    }
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});


app.post('/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).send({ success: false, message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount > 0) {
      res.send({ success: true, message: 'Password changed successfully' });
    } else {
      res.status(400).send({ success: false, message: 'Password update failed' });
    }
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).send({ success: false, message: "Internal server error" });
  }
});

// Example: routes/messageRoutes.js
app.get("/api/messages/:roomId", async (req, res) => {
  const roomId = req.params.roomId;

  try {
    const messages = await messagesCollection
      .find({ roomId })
      .sort({ timestamp: 1 }) // oldest to newest
      .toArray();

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.get("/message-user", async (req, res) => {
  try {
    const latestMessages = await messagesCollection.aggregate([
      {
        $match: { role: "client" } // শুধুমাত্র client role এর মেসেজ নিচ্ছে
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$senderId",
          latestMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$latestMessage" }
      }
    ]).toArray();

    res.json(latestMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


app.post("/client-data", async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      userId: user._id,
      name: user.name,
      email: user.username,
      number: user?.number,
      profileImage: user?.profileImage,
      role: user?.role,
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.get('/admin-users/:id', async (req, res) => {
  const loggedInUserId = req.params.id;

  try {
    // Check if the logged-in user is an admin
    const loggedInUser = await usersCollection.findOne({ _id: new ObjectId(loggedInUserId) });

    if (!loggedInUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (loggedInUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    // If admin, fetch all other users
    const users = await usersCollection
      .find({ _id: { $ne: new ObjectId(loggedInUserId) } })
      .toArray();

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/make-admin/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: 'admin' } }
    );
    res.status(200).json({ message: 'User promoted to admin' });
  } catch (error) {
    console.error('Error promoting to admin:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

app.put('/make-user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: 'user' } }
    );
    res.status(200).json({ message: 'User promoted to user' });
  } catch (error) {
    console.error('Error promoting to admin:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

app.put('/make-moderator/:id', async (req, res) => {
  const userId = req.params.id;
  const { roleType } = req.body;

  if (!roleType) {
    return res.status(400).json({ error: 'Role is required' });
  }

  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: "moderator", moderatorRole: roleType } }
    );    
    res.status(200).json({ message: `User updated to ${roleType}` });
  } catch (error) {
    console.error('Error updating moderator:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.post("/api/blogs", async (req, res) => {
  try {
    const blogPost = req.body;
    const result = await blogsCollection.insertOne(blogPost);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to add blog", details: error.message });
  }
});

app.get("/api/blogs", async (req, res)=>{
  try{
    const result = await blogsCollection.find().toArray();
    res.send(result);
  }catch(error){
    res.status(500).send({ error: "Failed to fetch blog", details: error.message });
  }
})

// Route to get a single blog by ID
app.get("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return res.status(404).send({ error: "Blog not found" });
    }

    res.send(blog)
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch blog", details: error.message });
  }
});


app.delete("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await blogsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to delete blog" });
  }
});

// Update blog
app.put("/api/blogs/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  try {
    const result = await blogsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to update blog" });
  }
});




const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://www.servicepro24x7.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUser", (roomId) => {
    socket.join(roomId);
    console.log("User joined room:", roomId);
    socket.emit("connected");
  });

  socket.on("send_message", async(msg) => {
    try {
      const {
        senderId,
        senderName,
        serviceId,
        message,
        roomId,
        type,
        fileUrl,
        role,
        profileImage
      } = msg;
      // মেসেজ ডাটাবেসে সংরক্ষণ করা
      const newMessage = {
        senderId: senderId,
        serviceId: serviceId,
        senderName,
        message: message,
        fileUrl: fileUrl,
        type: type,
        roomId: roomId,
        timestamp: new Date(),
        role,
        profileImage
      };

      await messagesCollection.insertOne(newMessage);

      // রিসিভেন্টের রুমে মেসেজ পাঠান
      io.to(roomId).emit("receiveMessage", {
        senderId,
        senderName,
        serviceId,
        message,
        fileUrl,
        type,
        roomId,
        timestamp: new Date(),
        role,
        profileImage
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Socket.IO server running on port 3000");
});