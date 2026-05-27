const projectService = require('../services/projectService');

async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body, req.user.userId);
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(parseInt(req.params.projectId));
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

async function getMyProjects(req, res, next) {
  try {
    const projects = await projectService.getUserProjects(req.user.userId);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

async function updateProgress(req, res, next) {
  try {
    const project = await projectService.updateProgress(
      parseInt(req.params.projectId),
      req.body,
      req.user.userId
    );
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function linkGithubRepo(req, res, next) {
  try {
    const { github_repo_url } = req.body;
    const project = await projectService.updateGithubRepo(
      parseInt(req.params.projectId),
      github_repo_url,
      req.user.userId
    );
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

async function getAllProjects(req, res, next) {
  try {
    const projects = await projectService.getAllProjects();
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

module.exports = { createProject, getProject, getMyProjects, updateProgress, linkGithubRepo, getAllProjects };
