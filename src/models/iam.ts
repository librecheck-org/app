// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * Tokens released by the server.
 */
export interface Tokens {
    /**
     * Access token.
     */
    accessToken: string;

    /**
     * Refresh token.
     */
    refreshToken: string;
}