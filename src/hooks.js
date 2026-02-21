import { useGraphqlMutation, useGraphqlQuery } from "@openimis/fe-core";
import _ from "lodash";
import { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    CREATE_FORM_DEFINITION,
    DELETE_FORM_DEFINITION,
    GET_FORM_CONTROLS_SCHEMA,
    GET_FORM_DEFINITION,
    GET_FORM_DEFINITIONS,
    UPDATE_FORM_DEFINITION,
} from "./queries";

const LOCAL_STORAGE_KEY = "openimis_form_builder_drafts";

export const useFormDefinitionsQuery = ({ filters }, config) => {
    const { isLoading, error, data, refetch } = useGraphqlQuery(
        GET_FORM_DEFINITIONS,
        filters,
        config
    );

    const formDefinitions = useMemo(() => {
        const backendForms = data ? _.map(data.formDefinitions?.edges, "node") : [];
        let allForms = [...backendForms];

        // Apply frontend filter if needed
        if (filters && filters.name_Icontains) {
            const searchName = filters.name_Icontains.toLowerCase();
            allForms = allForms.filter(f => f.name && f.name.toLowerCase().includes(searchName));
        }

        return allForms;
    }, [data, filters]);

    const pageInfo = useMemo(() => {
        return data
            ? data.formDefinitions?.pageInfo || {}
            : {};
    }, [data]);

    return { isLoading, error, data: { formDefinitions, pageInfo }, refetch };
};

export const useFormDefinitionQuery = (uuid, config) => {
    const { isLoading, error, data, refetch } = useGraphqlQuery(
        GET_FORM_DEFINITION,
        { uuid },
        { ...config, skip: config?.skip || !uuid }
    );

    return useMemo(() => {
        let formDef = data?.formDefinition;
        if (formDef && typeof formDef.schema === 'string') {
            try {
                formDef = { ...formDef, schema: JSON.parse(formDef.schema) };
            } catch (e) {
                console.error("Failed to parse backend form schema", e);
            }
        }

        return { isLoading, error, data: formDef, refetch };
    }, [isLoading, error, data, refetch]);
};

export const useFormDefinitionCreateMutation = () => {
    const backendMutation = useGraphqlMutation(CREATE_FORM_DEFINITION, {
        onSuccess: (data) => data?.createFormDefinition,
    });

    return {
        ...backendMutation,
        mutate: (variables, options) => {
            const inputPayload = {
                clientMutationId: uuidv4(),
                ...variables,
                schema: typeof variables.schema !== 'string' ? JSON.stringify(variables.schema) : variables.schema,
            };
            backendMutation.mutate({ input: inputPayload }, options);
        }
    };
};

export const useFormDefinitionUpdateMutation = () => {
    const backendMutation = useGraphqlMutation(UPDATE_FORM_DEFINITION, {
        onSuccess: (data) => data?.updateFormDefinition,
    });

    return {
        ...backendMutation,
        mutate: (variables, options) => {
            const inputPayload = {
                clientMutationId: uuidv4(),
                ...variables,
                schema: typeof variables.schema !== 'string' ? JSON.stringify(variables.schema) : variables.schema,
            };
            // GraphQL update schemas typically expect "id" instead of "uuid" for the PK in the input payload
            if (inputPayload.uuid && !inputPayload.id) {
                inputPayload.id = inputPayload.uuid;
                delete inputPayload.uuid;
            }
            backendMutation.mutate({ input: inputPayload }, options);
        }
    };
};

export const useFormDefinitionDeleteMutation = () => {
    const backendMutation = useGraphqlMutation(DELETE_FORM_DEFINITION, {
        onSuccess: (data) => data?.deleteFormDefinition,
    });

    return {
        ...backendMutation,
        mutate: (variables, options) => {
            const inputPayload = {
                clientMutationId: uuidv4(),
                id: variables.uuid || variables.id,
            };
            backendMutation.mutate({ input: inputPayload }, options);
        }
    };
};

export const useFormControlsSchemaQuery = (config) => {
    const { isLoading, error, data, refetch } = useGraphqlQuery(
        GET_FORM_CONTROLS_SCHEMA,
        {},
        config
    );

    const schema = useMemo(() => {
        let parsed = null;
        if (data?.formControlsSchema) {
            try {
                parsed = typeof data.formControlsSchema === "string"
                    ? JSON.parse(data.formControlsSchema.replace(/'/g, '"'))
                    : data.formControlsSchema;
            } catch (e) {
                console.error("Failed to parse formControlsSchema", e);
            }
        }

        // Provide a full frontend fallback if the backend schema is completely missing or incomplete
        const defaultProperties = [
            { name: "name", type: "text", label: "Name" },
            { name: "label", type: "text", label: "Label" },
            { name: "required", type: "boolean", label: "Required" }
        ];

        const selectProperties = [
            ...defaultProperties,
            { name: "options", type: "text", label: "Options (comma-separated)" }
        ];

        const fullSchema = {
            text: { type: "text", label: "Text", properties: defaultProperties },
            number: { type: "number", label: "Number", properties: defaultProperties },
            date: { type: "date", label: "Date", properties: defaultProperties },
            boolean: { type: "boolean", label: "Boolean", properties: defaultProperties },
            select: { type: "select", label: "Dropdown", properties: selectProperties },
            ...(parsed || {}) // override with any backend-provided schema if available
        };

        return fullSchema;
    }, [data?.formControlsSchema]);

    return { isLoading, error, data: schema, refetch };
};

// ==========================================
// DYNAMIC FORM DATA MANAGEMENT (LOCAL STORAGE)
// ==========================================

const getFormDataList = (formUuid) => {
    try {
        const key = `openimis_form_data_${formUuid}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error loading local form data", e);
        return [];
    }
};

const saveFormDataList = (formUuid, data) => {
    try {
        const key = `openimis_form_data_${formUuid}`;
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving local form data", e);
    }
};

// Fetch all entries for a given form definition
export const useFormDataListQuery = (formUuid, config) => {
    const skip = config?.skip || !formUuid;
    const [tick, setTick] = useState(0);
    const refetch = useCallback(() => setTick(t => t + 1), []);

    return useMemo(() => {
        if (skip) return { isLoading: false, data: [], refetch };
        return { isLoading: false, data: getFormDataList(formUuid), refetch };
    }, [formUuid, skip, tick, refetch]);
};

// Fetch a single entry for a given form definition
export const useFormDataQuery = (formUuid, entryId, config) => {
    const skip = config?.skip || !formUuid || !entryId || entryId === 'new';
    const [tick, setTick] = useState(0);
    const refetch = useCallback(() => setTick(t => t + 1), []);

    return useMemo(() => {
        if (skip) return { isLoading: false, data: null, refetch };
        const list = getFormDataList(formUuid);
        const item = list.find(l => l.id === entryId);
        return { isLoading: false, data: item || null, refetch };
    }, [formUuid, entryId, skip, tick, refetch]);
};

// Create a new data entry
export const useFormDataCreateMutation = () => {
    return {
        mutate: (variables, options) => {
            const { formUuid, ...payload } = variables;
            const list = getFormDataList(formUuid);

            const newEntry = {
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                ...payload
            };

            list.push(newEntry);
            saveFormDataList(formUuid, list);

            if (options && options.onSuccess) {
                options.onSuccess(newEntry);
            }
        }
    };
};

// Update an existing data entry
export const useFormDataUpdateMutation = () => {
    return {
        mutate: (variables, options) => {
            const { formUuid, id, ...payload } = variables;
            const list = getFormDataList(formUuid);
            const index = list.findIndex(l => l.id === id);

            if (index > -1) {
                list[index] = { ...list[index], ...payload, updatedAt: new Date().toISOString() };
                saveFormDataList(formUuid, list);

                if (options && options.onSuccess) {
                    options.onSuccess(list[index]);
                }
            } else if (options && options.onError) {
                options.onError(new Error("Entry not found"));
            }
        }
    };
};

// Delete a data entry
export const useFormDataDeleteMutation = () => {
    return {
        mutate: (variables, options) => {
            const { formUuid, id } = variables;
            let list = getFormDataList(formUuid);
            const initialLength = list.length;
            list = list.filter(l => l.id !== id);

            if (list.length < initialLength) {
                saveFormDataList(formUuid, list);
                if (options && options.onSuccess) {
                    options.onSuccess({ success: true });
                }
            } else if (options && options.onError) {
                options.onError(new Error("Entry not found"));
            }
        }
    };
};
