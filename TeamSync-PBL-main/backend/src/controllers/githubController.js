// backend/src/controllers/githubController.js
const githubService = require('../services/githubService');

/**
 * Generates and returns the GitHub OAuth authorization URL
 */
async function getOAuthUrl(req, res, next) {
    try {
        if (!process.env.GITHUB_CLIENT_ID) {
            return res.status(503).json({ error: 'GitHub OAuth not configured' });
        }
        const url = githubService.getOAuthUrl();
        res.json({ url });
    } catch (err) {
        next(err);
    }
}

/**
 * Handles exchanging the authorization code for a token and linking the account
 */
async function connectGithub(req, res, next) {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'GitHub OAuth code required' });
        }
        const result = await githubService.connectGithubAccount(req.user.userId, code);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
}

/**
 * Handles the standard GET OAuth callback redirect from GitHub
 */
async function handleGithubCallback(req, res, next) {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Authorization code missing from callback query parameters' 
            });
        }
        
        // Link the account using the temporary code
        const result = await githubService.connectGithubAccount(req.user.userId, code);
        
        res.json({ 
            success: true, 
            message: 'GitHub account linked successfully', 
            ...result 
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Triggers a synchronization cycle for a specific project's contributions
 */
async function syncContributions(req, res, next) {
    try {
        const projectId = parseInt(req.params.projectId);
        const result = await githubService.syncProjectContributions(projectId);
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
}

/**
 * Retrieves the contribution summary and metrics for a specific project
 */
async function getContributionSummary(req, res, next) {
    try {
        const projectId = parseInt(req.params.projectId);
        const summary = await githubService.getContributionSummary(projectId);
        res.json({ summary });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getOAuthUrl,
    connectGithub,
    handleGithubCallback,
    syncContributions,
    getContributionSummary
};
