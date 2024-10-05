import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/authMiddleware.js';
import { User } from '../models/model.js';


dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GM,
    pass: process.env.PAS,
  },
});

const sendOTP = (email, otp) => {
  const mailOptions = {
    from: process.env.GM,
    to: email,
    subject: 'Your Vidify Authentication OTP Code',
    text: `Your OTP code is ${otp}`,
  };
  return transporter.sendMail(mailOptions);
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerService = async (req, res) => {
  const { username, email } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.json({ success: false, message: 'Email already registered' });
  }

  const otp = generateOTP();
  await sendOTP(email, otp);

  const newUser = new User({
    username,
    email,
    password: await bcrypt.hash('defaultPassword', 10),
    otp,
  });

  await newUser.save();

  res.json({ success: true, message: 'OTP sent to email' });
};

const loginService = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ success: false, message: 'Email not registered' });
    
  }

  const otp = generateOTP();
  await sendOTP(email, otp);

  user.otp = otp;
  await user.save();

  res.json({ success: true, message: 'OTP sent to email' });
};

const verifyOTPService = async (req, res) => {
  const { email, otp, username } = req.body;

  const user = await User.findOne({ email, otp });

  if (!user) {
    return res.json({ success: false, message: 'Invalid OTP' });
  }

  user.otp = null;
  await user.save();

  let newUser;
  if (username) {
    const hashedPassword = await bcrypt.hash('defaultPassword', 10);
    user.username = username;
    user.password = hashedPassword;
    await user.save();
    newUser = user;
  } else {
    newUser = user;
  }

  const token = generateToken(newUser);
  res.json({ success: true, token });
};

export { registerService, loginService, verifyOTPService };
