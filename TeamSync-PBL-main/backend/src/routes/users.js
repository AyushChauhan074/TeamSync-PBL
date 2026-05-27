const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.get('/', authenticate, ctrl.getAllUsers);
router.get('/search', authenticate, ctrl.searchUsers);
router.get('/me', authenticate, ctrl.getProfile);
router.patch('/me', authenticate, validate(schemas.updateProfile), ctrl.updateProfile);
router.get('/me/stats', authenticate, ctrl.getStats);
router.get('/me/contributions', authenticate, ctrl.getContributions);
router.get('/:userId', authenticate, ctrl.getProfile);
router.get('/:userId/stats', authenticate, ctrl.getStats);
router.get('/:userId/contributions', authenticate, ctrl.getContributions);
router.patch('/:userId/deactivate', authenticate, authorize('admin'), ctrl.deactivateUser);

module.exports = router;

