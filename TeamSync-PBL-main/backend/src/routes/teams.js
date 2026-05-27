const router = require('express').Router();
const ctrl = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.get('/', authenticate, ctrl.getAllTeams);
router.post('/', authenticate, validate(schemas.createTeam), ctrl.createTeam);
router.get('/my', authenticate, ctrl.getMyTeams);
router.post('/join', authenticate, validate(schemas.joinTeam), ctrl.joinTeam);
router.get('/:teamId', authenticate, ctrl.getTeam);
router.delete('/:teamId/leave', authenticate, ctrl.leaveTeam);

module.exports = router;
