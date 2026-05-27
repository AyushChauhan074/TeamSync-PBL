const router = require('express').Router();
const ctrl = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.get('/', authenticate, ctrl.getAllProjects);
router.post('/', authenticate, validate(schemas.createProject), ctrl.createProject);
router.get('/my', authenticate, ctrl.getMyProjects);
router.get('/:projectId', authenticate, ctrl.getProject);
router.patch('/:projectId/progress', authenticate, validate(schemas.updateProgress), ctrl.updateProgress);
router.patch('/:projectId/repo', authenticate, ctrl.linkGithubRepo);

module.exports = router;
