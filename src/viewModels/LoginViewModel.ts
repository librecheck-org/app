import * as EmailValidator from "email-validator";
import { AppInfoApiClient, AppVersion, FairUseTokenApiClient, IamApiClient } from "@/apiClients";
import { ViewModel, useCommand, useViewModel } from "@/infrastructure";
import { useAppInfoStore, useCurrentUserStore, useTokensStore } from "@/stores";
import { Command } from "@/infrastructure/Command";
import { reactive } from "vue";
import router from "@/router";

export enum LoginViewState {
    EmailAddressCollection,
    AuthCodeCollection,
    LoginSucceeded,
}

class LoginViewProps {
    state: LoginViewState = LoginViewState.EmailAddressCollection;
    emailAddress: string | undefined;
    authCode: string | undefined;
    apiVersion: AppVersion | undefined;
}

class LoginViewCommands {
    constructor(
        public updateAppCommand: Command,
        public requestAuthCodeCommand: Command,
        public verifyAuthCodeCommand: Command) {
    }
}

export const useLoginViewModel = (): ViewModel<LoginViewProps, LoginViewCommands> => {
    const _appInfoStore = useAppInfoStore();
    const _tokensStore = useTokensStore();
    const _currentUserStore = useCurrentUserStore();

    const props = reactive(new LoginViewProps());

    async function initialize() {
        const appInfoApiClient = new AppInfoApiClient();
        props.apiVersion = await appInfoApiClient.getAppVersion();
    }

    function _canUpdateApp(): boolean {
        return props.state == LoginViewState.EmailAddressCollection
            && _appInfoStore.updatesAreAvailable;
    }

    async function _updateApp(): Promise<void> {
        _appInfoStore.applyUpdates();
    }

    async function _getFairUseToken() {
        const fairUseTokenApiClient = new FairUseTokenApiClient();
        return await fairUseTokenApiClient.getFairUseTokenV1();
    }

    function _canRequestAuthCode(): boolean {
        return props.state == LoginViewState.EmailAddressCollection
            && props.emailAddress !== undefined
            && EmailValidator.validate(props.emailAddress);
    }

    async function _requestAuthCode() {
        const fairUseToken = await _getFairUseToken();

        const iamApiClient = new IamApiClient();
        await iamApiClient.requestLoginAuthCodeV1({
            requestLoginAuthCodeCommand: {
                userEmailAddress: props.emailAddress,
                fairUseToken: fairUseToken.token
            }
        });

        props.state = LoginViewState.AuthCodeCollection;
    }

    function _canVerifyAuthCode(): boolean {
        return props.state == LoginViewState.AuthCodeCollection
            && props.authCode !== undefined
            && props.authCode.trim().length > 0;
    }

    async function _verifyAuthCode() {
        const fairUseToken = await _getFairUseToken();
        const iamApiClient = new IamApiClient();

        const tokens = await iamApiClient.verifyLoginAuthCodeV1({
            verifyLoginAuthCodeCommand: {
                userEmailAddress: props.emailAddress,
                fairUseToken: fairUseToken.token,
                authCode: props.authCode!.trim()
            }
        });
        await _tokensStore.update(tokens);

        const currentUser = await iamApiClient.getCurrentUserV1();
        await _currentUserStore.update(currentUser);

        props.state = LoginViewState.LoginSucceeded;

        router.push({ name: "Home" });
    }

    const _updateAppCommand = useCommand(_canUpdateApp, _updateApp);
    const _requestAuthCodeCommand = useCommand(_canRequestAuthCode, _requestAuthCode);
    const _verifyAuthCodeCommand = useCommand(_canVerifyAuthCode, _verifyAuthCode);
    const commands = new LoginViewCommands(_updateAppCommand, _requestAuthCodeCommand, _verifyAuthCodeCommand);

    return useViewModel({ props, commands, initialize });
};
