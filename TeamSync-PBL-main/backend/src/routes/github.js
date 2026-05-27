const router = require('express').Router();
const ctrl = require('../controllers/githubController');
const { authenticate } = require('../middleware/auth');

// FIX 2: OAuth callback — GitHub redirects here with ?code=
// This route is PUBLIC (no authenticate) — user is not logged in yet at this point
// We relay the code to the frontend which then calls /oauth/connect with the user's JWT
router.get('/oauth/callback', (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const msg = error_description || error || 'GitHub authorization denied';
    return res.redirect(
      `${process.env.FRONTEND_URL}/profile?github_error=${encodeURIComponent(msg)}`
    );
  }

  // Relay code to frontend — frontend will POST it to /oauth/connect with user's JWT
  res.redirect(`${process.env.FRONTEND_URL}/profile?github_code=${encodeURIComponent(code)}`);
});

router.get('/oauth/url', authenticate, ctrl.getOAuthUrl);
router.post('/oauth/connect', authenticate, ctrl.connectGithub);
router.post('/sync/:projectId', authenticate, ctrl.syncContributions);
router.get('/contributions/:projectId', authenticate, ctrl.getContributionSummary);

module.exports = router;
