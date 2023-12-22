// Copyright (c) LibreCheck Team and Contributors <hello@librecheck.io>. All rights reserved.
//
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

export enum UpdatableEntityState {
    Unchanged = 0,
    Created = 1,
    Updated = 2,
    Deleted = 3
}

export interface UpdatableEntity {
    entityState: UpdatableEntityState;
}

export function updateEntityState(entity: UpdatableEntity, newState: UpdatableEntityState): void {
    switch (entity.entityState) {
        case UpdatableEntityState.Unchanged:
        case UpdatableEntityState.Updated:
            entity.entityState = newState;
            break;

        case UpdatableEntityState.Created:
            // A newly created entity can be updated, but it remains new.
            // So, state should only become deleted, in order to let it be cleaned up.
            if (newState === UpdatableEntityState.Deleted) {
                entity.entityState = newState;
            }
            break;

        case UpdatableEntityState.Deleted:
            throw new Error("A deleted entity cannot be updated");

        default:
            entity.entityState = newState;
            break;
    }
}