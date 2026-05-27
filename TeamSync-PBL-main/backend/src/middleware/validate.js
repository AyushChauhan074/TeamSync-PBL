const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map(d => d.message.replace(/['"]/g, ''));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
};

// Auth schemas
const schemas = {
  register: Joi.object({
    roll_number: Joi.string().alphanum().min(5).max(20).required(),
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid('student', 'faculty').default('student'),
    branch: Joi.string().max(50).optional(),
    year: Joi.number().integer().min(1).max(6).optional(),
    phone: Joi.string().max(15).optional(),
  }),

  login: Joi.object({
    rollNumber: Joi.string().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(15).allow('').optional(),
    github_username: Joi.string().max(50).allow('').optional(),
    linkedin_url: Joi.string().uri().allow('').optional(),
    bio: Joi.string().max(500).allow('').optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    interests: Joi.array().items(Joi.string()).optional(),
  }),

  createTeam: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow('').optional(),
    max_members: Joi.number().integer().min(2).max(10).default(6),
    required_skills: Joi.array().items(Joi.string()).optional(),
  }),

  joinTeam: Joi.object({
    team_code: Joi.string().length(6).uppercase().required(),
  }),

  createProject: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).allow('').optional(),
    team_id: Joi.number().integer().required(),
    github_repo_url: Joi.string().uri().allow('').optional(),
    due_date: Joi.date().iso().optional(),
  }),

  updateProgress: Joi.object({
    progress: Joi.number().integer().min(0).max(100).required(),
    status: Joi.string()
      .valid('planning', 'design', 'development', 'testing', 'completed')
      .required(),
  }),

  refreshToken: Joi.object({
    refresh_token: Joi.string().required(),
  }),
};

module.exports = { validate, schemas };
