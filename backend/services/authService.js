const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { requiredString } = require('../utils/validators');
const { hashPassword, verifyPassword } = require('../utils/password');
const { createToken } = require('../utils/token');

function toPublicUser(user) {
  return { id: user.id, username: user.username, role: user.role };
}

const authService = {
  async login(body) {
    const username = requiredString(body.username, 'username', { max: 50 });
    const password = requiredString(body.password, 'password', { max: 200 });

    const user = await userRepository.findByUsername(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new ApiError(401, 'Invalid username or password');
    }

    const publicUser = toPublicUser(user);
    const token = createToken({ id: user.id, username: user.username, role: user.role });

    return { token, user: publicUser };
  },

  async me(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(401, 'User no longer exists');
    return toPublicUser(user);
  },

  async changePassword(id, body) {
    const currentPassword = requiredString(body.current_password, 'current_password', { max: 200 });
    const newPassword = requiredString(body.new_password, 'new_password', { min: 6, max: 200 });

    const user = await userRepository.findByUsername(
      (await userRepository.findById(id))?.username
    );
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    await userRepository.updatePassword(id, hashPassword(newPassword));
    return { updated: true };
  },
};

module.exports = authService;
