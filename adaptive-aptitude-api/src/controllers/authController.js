'use strict';

/**
 * Auth Controller — Phase 14
 *
 * Implements authentication HTTP endpoints strictly adhering to frozen Phase 14 contracts.
 */

const authService = require('../services/authService');
const authConfig = require('../config/authConfig');

function isScalarString(val) {
  return typeof val === 'string' && val.length > 0;
}

function handleAuthError(err, res) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message
    }
  });
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!isScalarString(name) || !isScalarString(email) || !isScalarString(password)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'name, email, and password must be valid non-empty strings.'
        }
      });
    }

    const registered = await authService.register({ name, email, password });
    const user = registered.user || registered;

    return res.status(201).json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (err) {
    return handleAuthError(err, res);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!isScalarString(email) || !isScalarString(password)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'email and password must be valid non-empty strings.'
        }
      });
    }

    const result = await authService.login({ email, password });

    res.cookie(
      'refreshToken',
      result.refreshToken,
      authConfig.getRefreshCookieOptions({ maxAge: 604800000 })
    );

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: {
          userId: result.user.userId,
          name: result.user.name,
          email: result.user.email
        }
      }
    });
  } catch (err) {
    return handleAuthError(err, res);
  }
};

const refresh = async (req, res) => {
  try {
    const origin = req.headers.origin;

    if (!origin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'REFRESH_ORIGIN_REQUIRED',
          message: 'Origin header is required for refresh token exchange.'
        }
      });
    }

    if (!authConfig.CORS_ALLOWED_ORIGINS.has(origin)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CORS_ORIGIN_DENIED',
          message: 'Origin is not allowed.'
        }
      });
    }

    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token cookie is missing.'
        }
      });
    }

    const result = await authService.refresh({ rawRefreshToken, origin });

    const maxAge = Math.max(0, new Date(result.expiresAt).getTime() - Date.now());
    res.cookie(
      'refreshToken',
      result.refreshToken,
      authConfig.getRefreshCookieOptions({ maxAge })
    );

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn
      }
    });
  } catch (err) {
    res.clearCookie('refreshToken', authConfig.getClearRefreshCookieOptions());
    return handleAuthError(err, res);
  }
};

const logout = async (req, res) => {
  try {
    await authService.logout({ sessionId: req.user.sessionId });

    res.clearCookie('refreshToken', authConfig.getClearRefreshCookieOptions());

    return res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out.'
      }
    });
  } catch (err) {
    return handleAuthError(err, res);
  }
};

const revokeAll = async (req, res) => {
  try {
    await authService.revokeAll({ userId: req.user.userId });

    res.clearCookie('refreshToken', authConfig.getClearRefreshCookieOptions());

    return res.status(200).json({
      success: true,
      data: {
        message: 'All active sessions revoked.'
      }
    });
  } catch (err) {
    return handleAuthError(err, res);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getPrincipal({ userId: req.user.userId });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          avatar: user.avatar || null,
          createdAt: user.createdAt
        },
        session: {
          sessionId: req.user.sessionId,
          issuedAt: req.user.issuedAt,
          expiresAt: req.user.expiresAt
        }
      }
    });
  } catch (err) {
    return handleAuthError(err, res);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  revokeAll,
  getMe
};
