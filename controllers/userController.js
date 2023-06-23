import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";

const emailRegexExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;

//@desc     Auth User & Get Token
//@route    POST api/users/login
//@access   Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let user = null;
  const isEmail = emailRegexExp.test(email);
  if (isEmail) user = await User.findOne({ email });
  else user = await User.findOne({ username: email });

  if (user && (await user.matchPassword(password))) {
    return res.json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or Password");
  }
});

//@desc     REGISTER User & Get Token
//@route    POST api/users/register
//@access   Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const userExist = await User.findOne({ email });

  if (userExist) {
    res.status(400);
    throw new Error("User already exist with same email");
  }

  const userExistWithUserName = await User.findOne({ username });

  if (userExistWithUserName) {
    res.status(400);
    throw new Error("User already exist with same username");
  }

  const user = await User.create({ username, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid User Data");
  }
});

//@desc     Get all Users
//@route    GET api/users
//@access   Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

//@desc     Update User Profile
//@route    PUT api/users/profile/:id
//@access   Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    return res.json({
      _id: updatedUser._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not Found");
  }
});

export { getUsers, login, register, updateUserProfile };
