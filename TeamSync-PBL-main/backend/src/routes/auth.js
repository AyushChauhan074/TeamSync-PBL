const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.post('/register', validate(schemas.register), ctrl.register);
router.post('/login', validate(schemas.login), ctrl.login);
router.post('/refresh', validate(schemas.refreshToken), ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
