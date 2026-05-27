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

/**
 * Decode a Relay/GraphQL global ID (base64 "TypeName:pk") and return the raw
 * primary key string.  If the value is already a plain integer string (or any
 * value that cannot be decoded), it is returned as-is.
 *
 * Example: atob("Rm9ybURlZmluaXRpb25HUUxUeXBlOjE0Nw==") → "FormDefinitionGQLType:147" → "147"
 */
const decodeRelayId = (relayId) => {
    if (!relayId) return relayId;
    try {
        const decoded = atob(String(relayId));
        // Relay global IDs are "TypeName:pk"
        const colonIdx = decoded.lastIndexOf(':');
        if (colonIdx !== -1) {
            return decoded.slice(colonIdx + 1);
        }
    } catch (_e) {
        // not base64 – return as-is
    }
    return relayId;
};

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
            // The query returns a base64-encoded Relay global ID ("TypeName:pk").
            // The backend UpdateFormDefinitionMutation expects the raw integer pk.
            const decodedId = parseInt(decodeRelayId(variables.id), 10);
            const payload = {
                ...variables,
                id: Number.isNaN(decodedId) ? variables.id : decodedId,
                schema: typeof variables.schema !== 'string' ? JSON.stringify(variables.schema) : variables.schema,
            };
            // Remove uuid – the backend mutation uses the integer `id`, not the uuid string
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
            // Prefer relay global ID (variables.id); fall back to uuid.
            // The backend DeleteFormDefinitionMutation expects the integer PK.
            const rawId = variables.id || variables.uuid;
            const decodedId = parseInt(decodeRelayId(rawId), 10);
            mutation.mutate({ id: Number.isNaN(decodedId) ? rawId : decodedId }, options);
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
 * `relayId` preserves the original Relay global ID (base64) so that mutation
 * hooks can decode it to the integer PK expected by the backend.
 * `id` is set to the plain UUID for display / routing purposes.
 */
const normaliseSubmission = (node) => {
    if (!node) return null;
    const parsedData = typeof node.submissionData === 'string'
        ? (() => { try { return JSON.parse(node.submissionData); } catch (e) { return {}; } })()
        : (node.submissionData || {});
    return {
        ...node,
        ...parsedData,
        relayId: node.id,  // base64 Relay global ID – used by mutation hooks
        id: node.uuid,     // plain UUID – used for display and routing
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
 * variables: {
 *   formUuid: string,            – UUID from URL params (not used by backend)
 *   formDefinitionId: string,    – Relay global ID of the FormDefinition (base64)
 *   ...fieldValues
 * }
 * The backend CreateFormSubmissionMutation.Input.form_definition_id expects the
 * integer PK, so we decode the Relay global ID before sending.
 */
export const useFormDataCreateMutation = () => {
    const mutation = useGraphqlMutation(CREATE_FORM_SUBMISSION, {
        onSuccess: (data) => data?.createFormSubmission,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            const { formUuid, formDefinitionId: rawFormDefId, ...submissionData } = variables;
            // Decode Relay global ID → integer PK expected by the backend
            const decodedId = parseInt(decodeRelayId(rawFormDefId), 10);
            const payload = {
                formDefinitionId: Number.isNaN(decodedId) ? rawFormDefId : decodedId,
                data: typeof submissionData === 'string' ? submissionData : JSON.stringify(submissionData),
                status: 'submitted',
            };
            mutation.mutate(payload, options);
        }
    };
};

/**
 * Update an existing form submission (saves to backend).
 * variables: {
 *   formUuid: string,  – UUID from URL params (not used by backend)
 *   id: string,        – Relay global ID of the FormSubmission (base64)
 *   ...fieldValues
 * }
 * The backend UpdateFormSubmissionMutation.Input.id expects the integer PK.
 */
export const useFormDataUpdateMutation = () => {
    const mutation = useGraphqlMutation(UPDATE_FORM_SUBMISSION, {
        onSuccess: (data) => data?.updateFormSubmission,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            const { formUuid, id: rawId, ...submissionData } = variables;
            // Decode Relay global ID → integer PK expected by the backend
            const decodedId = parseInt(decodeRelayId(rawId), 10);
            const payload = {
                id: Number.isNaN(decodedId) ? rawId : decodedId,
                data: typeof submissionData === 'string' ? submissionData : JSON.stringify(submissionData),
            };
            mutation.mutate(payload, options);
        }
    };
};

/**
 * Delete a form submission on the backend.
 * variables: {
 *   formUuid: string,   – UUID from URL params (not used by backend)
 *   relayId: string,    – Relay global ID of the FormSubmission (base64)
 * }
 * The backend DeleteFormSubmissionMutation.Input.id expects the integer PK.
 */
export const useFormDataDeleteMutation = () => {
    const mutation = useGraphqlMutation(DELETE_FORM_SUBMISSION, {
        onSuccess: (data) => data?.deleteFormSubmission,
    });

    return {
        ...mutation,
        mutate: (variables, options) => {
            // Prefer explicit relayId; fall back to id (may be UUID – will fail at backend)
            const rawId = variables.relayId || variables.id || variables.uuid;
            const decodedId = parseInt(decodeRelayId(rawId), 10);
            mutation.mutate({ id: Number.isNaN(decodedId) ? rawId : decodedId }, options);
        }
    };
};
