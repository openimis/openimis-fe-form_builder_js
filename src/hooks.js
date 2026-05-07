import { useGraphqlMutation, useGraphqlQuery } from "@openimis/fe-core";
import _ from "lodash";
import { useMemo } from "react";
import {
    CREATE_FORM_DEFINITION,
    CREATE_FORM_SUBMISSION,
    DELETE_FORM_DEFINITION,
    DELETE_FORM_SUBMISSION,
    GET_FORM_CONTROLS_SCHEMA,
    GET_FORM_DEFINITION,
    GET_FORM_DEFINITIONS,
    GET_FORM_SUBMISSION,
    GET_FORM_SUBMISSIONS,
    UPDATE_FORM_DEFINITION,
    UPDATE_FORM_SUBMISSION,
} from "./queries";

// ==========================================
// FORM DEFINITION HOOKS (backend GraphQL)
// All queries use OrderedDjangoFilterConnectionField, so all responses are
// connections: { edges: [{ node: ... }] }
//
// useGraphqlMutation pattern (from other modules like PayerModule):
//   mutation.mutate(payload)
//   → useGraphqlMutation adds clientMutationId to payload
//   → sends variables = { input: payload }
//   → $input receives payload (with clientMutationId)
// So do NOT wrap in { input: ... } when calling mutate().
// ==========================================

export const useFormDefinitionsQuery = ({ filters }, config) => {
    const { isLoading, error, data, refetch } = useGraphqlQuery(
        GET_FORM_DEFINITIONS,
        filters,
        config
    );

    const formDefinitions = useMemo(() => {
        const backendForms = data ? _.map(data.formDefinition?.edges, "node") : [];
        let allForms = [...backendForms];

        // Apply frontend filter fallback for servers that don't support name_Icontains
        if (filters && filters.name_Icontains) {
            const searchName = filters.name_Icontains.toLowerCase();
            allForms = allForms.filter(f => f.name && f.name.toLowerCase().includes(searchName));
        }

        return allForms;
    }, [data, filters]);

    const pageInfo = useMemo(() => {
        return data ? data.formDefinition?.pageInfo || {} : {};
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
        // GET_FORM_DEFINITION returns a connection filtered by uuid → take the first edge
        const rawNode = data?.formDefinition?.edges?.[0]?.node || null;
        let formDef = rawNode;
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
    const mutation = useGraphqlMutation(CREATE_FORM_DEFINITION, {
        onSuccess: (data) => data?.createFormDefinition,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            // Pass payload directly; useGraphqlMutation adds clientMutationId and wraps in { input: payload }
            const payload = {
                ...variables,
                schema: typeof variables.schema !== 'string' ? JSON.stringify(variables.schema) : variables.schema,
            };
            mutation.mutate(payload, options);
        }
    };
};

export const useFormDefinitionUpdateMutation = () => {
    const mutation = useGraphqlMutation(UPDATE_FORM_DEFINITION, {
        onSuccess: (data) => data?.updateFormDefinition,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            // variables.id must be the relay global ID (from edited.id loaded via the query)
            const payload = {
                ...variables,
                schema: typeof variables.schema !== 'string' ? JSON.stringify(variables.schema) : variables.schema,
            };
            // Remove uuid if present — backend expects relay global `id`, not plain uuid string
            delete payload.uuid;
            mutation.mutate(payload, options);
        }
    };
};

export const useFormDefinitionDeleteMutation = () => {
    const mutation = useGraphqlMutation(DELETE_FORM_DEFINITION, {
        onSuccess: (data) => data?.deleteFormDefinition,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            mutation.mutate({ id: variables.uuid || variables.id }, options);
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
            ...(parsed || {})
        };

        return fullSchema;
    }, [data?.formControlsSchema]);

    return { isLoading, error, data: schema, refetch };
};

// ==========================================
// FORM SUBMISSION HOOKS (backend GraphQL)
// Replaces previous localStorage-based useFormData* hooks.
// FormSubmission is stored on the backend linked to a FormDefinition.
// ==========================================

/**
 * Parse submissionData JSON and normalise a submission node for component use.
 */
const normaliseSubmission = (node) => {
    if (!node) return null;
    const parsedData = typeof node.submissionData === 'string'
        ? (() => { try { return JSON.parse(node.submissionData); } catch (e) { return {}; } })()
        : (node.submissionData || {});
    return {
        ...node,
        ...parsedData,
        id: node.uuid,
        createdAt: node.dateValidFrom,
    };
};

/**
 * List all submissions for a given form definition UUID.
 */
export const useFormDataListQuery = (formUuid, config) => {
    const skip = config?.skip || !formUuid;

    const { isLoading, error, data, refetch } = useGraphqlQuery(
        GET_FORM_SUBMISSIONS,
        { formUuid },
        { ...config, skip }
    );

    const entries = useMemo(() => {
        if (!data?.formSubmission?.edges) return [];
        return data.formSubmission.edges.map(({ node }) => normaliseSubmission(node));
    }, [data]);

    return { isLoading, error, data: entries, refetch };
};

/**
 * Fetch a single submission by uuid.
 * entryId may be the submission uuid or 'new' (for create path).
 * GET_FORM_SUBMISSION returns a connection filtered by uuid → take first edge.
 */
export const useFormDataQuery = (formUuid, entryId, config) => {
    const skip = config?.skip || !formUuid || !entryId || entryId === 'new';

    const { isLoading, error, data, refetch } = useGraphqlQuery(
        GET_FORM_SUBMISSION,
        { uuid: entryId },
        { ...config, skip }
    );

    const entry = useMemo(() => {
        const node = data?.formSubmission?.edges?.[0]?.node || null;
        return normaliseSubmission(node);
    }, [data]);

    return { isLoading, error, data: entry, refetch };
};

/**
 * Create a new form submission (saves to backend).
 * variables: { formUuid: string, ...fieldValues }
 */
export const useFormDataCreateMutation = () => {
    const mutation = useGraphqlMutation(CREATE_FORM_SUBMISSION, {
        onSuccess: (data) => data?.createFormSubmission,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            const { formUuid, ...submissionData } = variables;
            const payload = {
                formDefinitionId: formUuid,
                data: typeof submissionData === 'string' ? submissionData : JSON.stringify(submissionData),
                status: 'submitted',
            };
            mutation.mutate(payload, options);
        }
    };
};

/**
 * Update an existing form submission (saves to backend).
 * variables: { formUuid: string, id: string (submission uuid), ...fieldValues }
 */
export const useFormDataUpdateMutation = () => {
    const mutation = useGraphqlMutation(UPDATE_FORM_SUBMISSION, {
        onSuccess: (data) => data?.updateFormSubmission,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            const { formUuid, id, ...submissionData } = variables;
            const payload = {
                id,
                data: typeof submissionData === 'string' ? submissionData : JSON.stringify(submissionData),
            };
            mutation.mutate(payload, options);
        }
    };
};

/**
 * Delete a form submission on the backend.
 * variables: { formUuid: string, id: string (submission uuid) }
 */
export const useFormDataDeleteMutation = () => {
    const mutation = useGraphqlMutation(DELETE_FORM_SUBMISSION, {
        onSuccess: (data) => data?.deleteFormSubmission,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            mutation.mutate({ id: variables.id || variables.uuid }, options);
        }
    };
};
