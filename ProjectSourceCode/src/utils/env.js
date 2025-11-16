const requireEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Environment variable ${name} is required. Please set it in your .env file.`
    );
  }

  return value;
};

module.exports = {
  requireEnv,
};
