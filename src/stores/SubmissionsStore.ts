// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { StorageKey, SubmissionDraft, Submissions } from "@/models";
import { defineIonicStore, useIonicStorage } from "@/infrastructure";
import { DefinitionDetails } from "@/apiClients";
import { newUuid } from "@/helpers";
import { ref } from "vue";

export function useSubmissionsStore() {
    const storageKey = StorageKey.Submissions;
    return defineIonicStore(storageKey, () => {
        const _value = ref<Submissions>({ summaries: [], details: {}, drafts: {} });

        const { ensureIsInitialized: _ensureIsInitialized, update } = useIonicStorage(storageKey, _value);

        async function ensureIsInitialized() {
            await _ensureIsInitialized();
        }

        async function createDraft(definition: DefinitionDetails): Promise<SubmissionDraft> {
            const draft = {
                uuid: newUuid(),
                definition: definition,
                contents: "{}"
            };
            await update({ drafts: { ..._value.value.drafts, [draft.uuid]: draft } });
            return draft;
        }

        function readDraft(submissionUuid: string): SubmissionDraft | undefined {
            return _value.value.drafts[submissionUuid];
        }

        return {
            value: _value, ensureIsInitialized, update,
            createDraft, readDraft
        };
    });
}