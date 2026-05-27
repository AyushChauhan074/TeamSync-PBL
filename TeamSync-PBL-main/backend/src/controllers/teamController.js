const teamService = require('../services/teamService');

async function createTeam(req, res, next) {
  try {
    const team = await teamService.createTeam(req.body, req.user.userId);
    res.status(201).json({ success: true, team });
  } catch (err) {
    next(err);
  }
}

async function joinTeam(req, res, next) {
  try {
    const { team_code } = req.body;
    const team = await teamService.joinTeamByCode(team_code, req.user.userId);
    res.json({ success: true, team });
  } catch (err) {
    next(err);
  }
}

async function leaveTeam(req, res, next) {
  try {
    await teamService.leaveTeam(parseInt(req.params.teamId), req.user.userId);
    res.json({ success: true, message: 'Left team successfully' });
  } catch (err) {
    next(err);
  }
}

async function getTeam(req, res, next) {
  try {
    const team = await teamService.getTeamById(parseInt(req.params.teamId));
    res.json({ team });
  } catch (err) {
    next(err);
  }
}

async function getMyTeams(req, res, next) {
  try {
    const teams = await teamService.getMyTeams(req.user.userId);
    res.json({ teams });
  } catch (err) {
    next(err);
  }
}

async function getAllTeams(req, res, next) {
  try {
    const teams = await teamService.getAllTeams(req.query.search);
    res.json({ teams });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTeam, joinTeam, leaveTeam, getTeam, getMyTeams, getAllTeams };
