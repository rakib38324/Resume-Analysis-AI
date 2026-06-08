const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getDashboardStats, getAllUsers, updateUser, deleteUser } = require('../controllers/admin.controller');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
