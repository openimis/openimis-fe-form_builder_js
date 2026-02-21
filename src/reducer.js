import { combineReducers } from "redux";

const initialState = {
    formDefinitions: [],
    currentForm: null,
    loading: false,
    error: null,
};

const formBuilder = (state = initialState, action) => {
    switch (action.type) {
        // Add cases here for fetching forms, saving, etc.
        default:
            return state;
    }
};

export const formBuilderReducer = combineReducers({
    default: formBuilder,
});
