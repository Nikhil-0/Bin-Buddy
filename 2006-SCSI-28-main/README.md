
# SC2006 - Software Engineering
# Bin Buddy - An E-waste Recycling App


| Lab Group  | SCSI                                  |
|------------|---------------------------------------|
| Team       | Group 3                               |
| Title      | Bin Buddy                             |
| Members    | HTOO MYAT NOE (U2422977K)             |
|            | ARMAN KHAN (U2421760A)                |
|            | CHUA YUE JUN (U2423015D)              |
|            | NIKHIL MADETI (U2421243D)             |
|            | SOH CEK CONG (U2423500C)              |
|            | YOONG HONG JUN, NICHOLAS (U2321582L)  |


# Demo Video
[![Watch on YouTube](https://img.shields.io/badge/▶%20Watch%20Demo%20Video-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=LX0xQ9jAtFc)

# Our App and Target Users
Our system’s target users are E-waste disposers. With climate change being prevalent in today’s world, E-waste being frequently discarded and people wanting to engage in more environmentally friendly practices, the government has set up E-waste disposal bins all around the country. E-waste is electronic equipment of any kind that has been discarded. In 2023, Singapore produced about 60,000 tonnes of E-waste, but only 16,0000 tonnes were recycled (Strait Times, 2024). The low E-waste recycling rate is due to the lack of awareness, as many people do not know E-waste bins exist, or find it inconvenient to recycle. Our team aims to make the recycling process more convenient by making it easier for electronic users to locate recycling bins near where they work or stay.

With our web application (app), users of our app will be able to quickly locate the E-waste disposal bins near them, and be directed to the nearest ones with the highest occupancy, along with gaining access to educational guidelines, among others. We will use NEA’s dataset on E-waste disposal bins around Singapore from data.gov.sg for the development of our app. 

## Admin account setup

The application supports creating admin accounts at registration by providing a secret admin code. To enable this, set an environment variable `ADMIN_CODE` on the server.

When `ADMIN_CODE` is set, a user who provides the exact same code in the "Admin Code" field on the registration page will be created with admin privileges (`isAdmin: true`). If the code is not set or incorrect, admin creation is denied.

Example (PowerShell):
```powershell
# Windows PowerShell - set for current session
$env:ADMIN_CODE = "my-secret-admin-code"
```

For production, set `ADMIN_CODE` in your environment or deployment configuration (do NOT commit the code to source control).

🧩 E-waste bin locator Web App

A full-stack Node.js + Express.js application with secure authentication, password recovery, and admin access control.
Users can register, log in, ask queries, set reminders, locate nearest E-waste bins, save their locations, update their profiles, change passwords, and reset forgotten ones. Admins have separate login access.

Features
- User Authentication (Register, Login, Logout)
- Role-Based Access Control (User & Admin)
- Password Recovery via Email (SendGrid SMTP)
- Session Management using express-session
- MongoDB for data storage
- Flash Messages using a custom alertMessage() helper
- Security: Bcrypt password hashing, session validation, flagged/suspended user check

🛠️ Tech Stack
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose ODM)
- Templating Engine: Handlebars (hbs)
- Maps: Google Maps API
- Mail Service: SendGrid SMTP
- Session Management: express-session + connect-mongo

🧑‍💻 Setup Instructions
Follow these steps to set up the project on your own system or server.

1️⃣ Clone the repository

git clone https://github.com/softwarelab3/2006-SCSI-28.git

cd 2006-SCSI-28

2️⃣ Install dependencies
Make sure you have Node.js (v18+) and npm installed.
Then install all required packages:

npm install

3️⃣ Configure Environment Variables
Create a .env file in the project root and copy the following keys:
    SENDGRID_API_KEY="Your_API_KEY_HERE"
    EMAIL_USER="YOUR_EMAIL_HERE"
    ADMIN_CODE="BINBUDDY2025"
    GOOGLE_MAPS_API_KEY="Your_API_KEY_HERE"
    MONGO_URI="YOUR_DB_HERE"

# Map API (Google Maps)
- GOOGLE_MAPS_API_KEY=your_api_key_here
- Ensure Map, Geolocation and Directions services are enabled

# Email Configuration (SendGrid)
- SENDGRID_API_KEY=""your_sendgrid_api_key_here"
- EMAIL_USER="your_verified_sendgrid_sender_email"

# Optional Admin Code for privileged accounts
- ADMIN_CODE="your_admin_invite_code"


📝 Tips:
- Get your MongoDB connection URI from MongoDB Atlas
- Get a SendGrid API key from SendGrid Dashboard
- The EMAIL_USER must be a verified sender in SendGrid.

4️⃣ Run the server

Start the development server with:

npm run dev

or

node app.js


The app should now be running at:
👉 http://localhost:3000

5️⃣ Test Email Functionality
The system uses SendGrid to send password reset links.
To test it:
- Register a user with your own email.
- Go to /forgotpassword.
- Check your inbox for the reset link.

🔒 Admin Access
To create an admin account:
- During registration, enter the same ADMIN_CODE you configured in .env.
- Admins can access the admin dashboard at: /admin/dashboard

🧹 Useful Scripts
Command	Description
npm start:	Start the server
npm run dev:	Start server with nodemon for live reload
npm install: Install dependencies
npm audit fix:	Fix security issues


Common Issues
- Problem: ERR_TOO_MANY_REDIRECTS
👉 Clear cookies or check for infinite redirect loops in ensureAuthenticated() logic.

- Problem: “Cannot send email”
👉 Verify your SENDGRID_API_KEY and ensure your sender email is verified.

- Problem: “MongoNetworkError: connection refused”
👉 Ensure MongoDB URI is correct and accessible.