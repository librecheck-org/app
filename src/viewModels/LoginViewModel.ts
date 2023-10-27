import { AppInfoApiClient, AppVersion, FairUseTokenApiClient, IamApiClient } from "@/apiClients";
import { ViewModel, useCommand, useViewModel, writeToStorage } from "@/infrastructure";
import { reactive } from "vue";
import * as EmailValidator from "email-validator";
import { Command } from "@/infrastructure/Command";
import router from "@/router";
import { StorageKey } from "@/models";
import { useCurrentUserStore, useTokensStore } from "@/stores";

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
    constructor(public requestAuthCodeCommand: Command, public verifyAuthCodeCommand: Command) {
    }
}

export const useLoginViewModel = (): ViewModel<LoginViewProps, LoginViewCommands> => {
    const props = reactive(new LoginViewProps());
    const tokensStore = useTokensStore();
    const currentUserStore = useCurrentUserStore();

    const initialize = async () => {
        const appInfoApiClient = new AppInfoApiClient();
        props.apiVersion = await appInfoApiClient.getAppVersion();
    };

    const getFairUseToken = async () => {
        const fairUseTokenApiClient = new FairUseTokenApiClient();
        return await fairUseTokenApiClient.getFairUseTokenV1();
    }

    const canRequestAuthCode = () => {
        return props.state == LoginViewState.EmailAddressCollection
            && props.emailAddress !== undefined
            && EmailValidator.validate(props.emailAddress);
    }

    const requestAuthCode = async () => {
        const fairUseToken = await getFairUseToken();

        const iamApiClient = new IamApiClient();
        await iamApiClient.requestLoginAuthCodeV1({
            requestLoginAuthCodeCommand: {
                userEmailAddress: props.emailAddress,
                fairUseToken: fairUseToken.token
            }
        });

        props.state = LoginViewState.AuthCodeCollection;
    }

    const canVerifyAuthCode = () => {
        return props.state == LoginViewState.AuthCodeCollection
            && props.authCode !== undefined
            && props.authCode.trim().length > 0;
    }

    const verifyAuthCode = async () => {
        const fairUseToken = await getFairUseToken();
        const iamApiClient = new IamApiClient();

        const tokens = await iamApiClient.verifyLoginAuthCodeV1({
            verifyLoginAuthCodeCommand: {
                userEmailAddress: props.emailAddress,
                fairUseToken: fairUseToken.token,
                authCode: props.authCode!.trim()
            }
        });
        await tokensStore.update(tokens);

        const currentUser = await iamApiClient.getCurrentUserV1();
        await currentUserStore.update(currentUser);

        props.state = LoginViewState.LoginSucceeded;

        router.push({ name: "Home" });
    }

    const requestAuthCodeCommand = useCommand(canRequestAuthCode, requestAuthCode);
    const verifyAuthCodeCommand = useCommand(canVerifyAuthCode, verifyAuthCode);
    const commands = new LoginViewCommands(requestAuthCodeCommand, verifyAuthCodeCommand);

    return useViewModel({ props, commands, initialize });
}
