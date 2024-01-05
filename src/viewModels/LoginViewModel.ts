// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import * as EmailValidator from "email-validator";
import { FairUseTokenApiClient, IamApiClient } from "@/apiClients";
import { ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { useCurrentUserStore, useSystemStatusStore, useTokenStore } from "@/stores";
import { Command } from "@/infrastructure/Command";
import { reactive } from "vue";
import router from "@/router";

export enum LoginViewState {
    EmailAddressCollection,
    AuthCodeCollection,
    LoginSucceeded,
}

class LoginViewData {
    state: LoginViewState = LoginViewState.EmailAddressCollection;
    emailAddress: string | undefined;
    authCode: string | undefined;
}

class LoginViewCommands {
    constructor(
        public updateClientCommand: Command,
        public requestAuthCodeCommand: Command,
        public verifyAuthCodeCommand: Command) {
    }
}

export function useLoginViewModel(): ViewModel<LoginViewData, LoginViewCommands> {
    const _systemStatusStore = useSystemStatusStore();
    const _tokenStore = useTokenStore();
    const _currentUserStore = useCurrentUserStore();

    const data = reactive(new LoginViewData());

    async function initialize() {
    }

    function _canUpdateApp(): boolean {
        return data.state == LoginViewState.EmailAddressCollection
            && _systemStatusStore.clientUpdatesAreAvailable;
    }

    async function _updateApp(): Promise<void> {
        _systemStatusStore.applyClientUpdates();
    }

    async function _getFairUseToken() {
        const fairUseTokenApiClient = new FairUseTokenApiClient();
        return await fairUseTokenApiClient.getFairUseTokenV1();
    }

    function _canRequestAuthCode(): boolean {
        return data.state == LoginViewState.EmailAddressCollection
            && data.emailAddress !== undefined
            && EmailValidator.validate(data.emailAddress);
    }

    async function _requestAuthCode() {
        const fairUseToken = await _getFairUseToken();

        const iamApiClient = new IamApiClient();
        await iamApiClient.requestLoginAuthCodeV1({
            requestLoginAuthCodeCommand: {
                userEmailAddress: data.emailAddress,
                fairUseToken: fairUseToken.token
            }
        });

        data.state = LoginViewState.AuthCodeCollection;
    }

    function _canVerifyAuthCode(): boolean {
        return data.state == LoginViewState.AuthCodeCollection
            && data.authCode !== undefined
            && data.authCode.trim().length > 0;
    }

    async function _verifyAuthCode() {
        const fairUseToken = await _getFairUseToken();
        const iamApiClient = new IamApiClient();

        const tokens = await iamApiClient.verifyLoginAuthCodeV1({
            verifyLoginAuthCodeCommand: {
                userEmailAddress: data.emailAddress,
                fairUseToken: fairUseToken.token,
                authCode: data.authCode!.trim()
            }
        });
        await _tokenStore.update(tokens);

        const currentUser = await iamApiClient.getCurrentUserV1();
        await _currentUserStore.update(currentUser);

        data.state = LoginViewState.LoginSucceeded;

        router.push({ name: "Home" });
    }

    const _updateClientCommand = useCommand(_canUpdateApp, _updateApp);
    const _requestAuthCodeCommand = useCommand(_canRequestAuthCode, _requestAuthCode);
    const _verifyAuthCodeCommand = useCommand(_canVerifyAuthCode, _verifyAuthCode);
    const commands = new LoginViewCommands(_updateClientCommand, _requestAuthCodeCommand, _verifyAuthCodeCommand);

    return useViewModel({ data, commands, initialize });
}
