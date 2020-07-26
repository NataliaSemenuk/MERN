const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const router = Router();
// stopped at validation 34:44
// stopped at fronted styles 54:00
router.post(
  '/registr',
  [
    check('email', 'Incorrect email').isEmail(),
    check('password', 'Incorrect password').isLength({ min: 6 })
  ],
  async (req, res) => {
try {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: 'Incorrect data'
    })
  }
  const { email, password } = req.body;

  const candidate = await User.findOne({email});

  if (candidate) {
    return res.status(400).json({ message: 'The user exists'});
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({email, password: hashedPassword});

  await user.save();
  res.status(201).json({message: 'User was created'})
} catch (error) {
  res.status(500).json({ message: 'Smt wrong!'});
}
});

router.post(
  '/login',
  [
    check('email', 'Enter correct email'). normalizeEmail().isEmail(),
    check('password', 'Enter password').exists()
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Incorrect data'
      })
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if(!user) {
      return res.status(400).json({
        message: 'User dont find'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
      return res.status(400).json({
        message: 'Incorrect password. Try again'
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      config.get('jwtSecret'),
      { expiresIn: '1h' }
    );

    res.json({ token, userId: user.id })
  } catch (error) {
    res.status(500).json({ message: 'Smt wrong!'});
  }
});

module.exports = router;