const FORM_DEFINITION_FIELDS = `
  uuid
  name
  description
  formType
  schema
  entryPoint
  targetModel
  submitActions
  created
  updated
`;

export const GET_FORM_DEFINITIONS = `
    query formDefinitions($name: String) {
        formDefinitions(name_Icontains: $name) {
            edges {
                node {
                    ${FORM_DEFINITION_FIELDS}
                }
            }
            totalCount
            pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
            }
        }
    }
`;

export const GET_FORM_DEFINITION = `
    query formDefinition($uuid: String) {
        formDefinition(uuid: $uuid) {
            ${FORM_DEFINITION_FIELDS}
        }
    }
`;

export const CREATE_FORM_DEFINITION = `
    mutation createFormDefinition($input: CreateFormDefinitionMutationInput!) {
        createFormDefinition(input: $input) {
            clientMutationId
            formDefinition {
                ${FORM_DEFINITION_FIELDS}
            }
        }
    }
`;

export const UPDATE_FORM_DEFINITION = `
    mutation updateFormDefinition($input: UpdateFormDefinitionMutationInput!) {
        updateFormDefinition(input: $input) {
            clientMutationId
            formDefinition {
                ${FORM_DEFINITION_FIELDS}
            }
        }
    }
`;

export const DELETE_FORM_DEFINITION = `
    mutation deleteFormDefinition($input: DeleteFormDefinitionMutationInput!) {
        deleteFormDefinition(input: $input) {
            clientMutationId
        }
    }
`;

export const GET_FORM_CONTROLS_SCHEMA = `
    query formControlsSchema {
        formControlsSchema
    }
`;
