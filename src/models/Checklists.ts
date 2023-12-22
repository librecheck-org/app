// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import type { DefinitionDetails, DefinitionSummary, SubmissionDetails, SubmissionSummary } from "@/apiClients";
import { UpdatableEntity, UpdatableEntityState } from "./Base";

export interface Definitions {
    get summaries(): DefinitionSummary[];
    get details(): Record<string, DefinitionDetails>;
}

export interface Submissions {
    get summaries(): SubmissionSummary[];
    get details(): Record<string, SubmissionDetails>;
    get drafts(): Record<string, SubmissionDraft>;
}

export interface SubmissionDraft extends SubmissionDetails, UpdatableEntity {
    currentPageNumber: number;
    entityState: UpdatableEntityState;
}