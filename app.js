const express = require("express");
const instanceOfExpress = express();
let db = null;
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
instanceOfExpress.use(express.json());
const bcrypt = require("bcrypt");

const connectDbAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    instanceOfExpress.listen(3000, (request, response) => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
  }
};
connectDbAndStartServer();

instanceOfExpress.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 15);
  const checkQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(checkQuery);
  if (dbUser === undefined) {
    //create User
    const passwordLength = password.length;
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const postQuery = `INSERT INTO user (username,name,password,gender,location) VALUES
            ("${username}","${name}","${hashedPassword}",'${gender}',"${location}")
        ;`;
      const updatedDb = await db.run(postQuery);
      response.send("User created successfully");
    }
  } else {
    //valid User
    response.status(400);
    response.send("User already exists");
  }
});

instanceOfExpress.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(checkQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordValidity = await bcrypt.compare(password, dbUser.password);
    if (passwordValidity === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

instanceOfExpress.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(checkQuery);
  const passwordValidity = await bcrypt.compare(oldPassword, dbUser.password);
  if (passwordValidity === true) {
    const newPasswordLength = newPassword.length;
    if (newPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashedPassword = await bcrypt.hash(newPassword, 15);
      const updateQuery = `UPDATE user SET password = "${newHashedPassword}" 
            WHERE username = "${username}";`;
      const user = await db.run(updateQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = instanceOfExpress;
