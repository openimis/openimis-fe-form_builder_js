const FORM_DEFINITION_FIELDS = `
  id
  uuid
  name
  description
  formType
  schema
  entryPoint
  targetModel
  submitActions
  dateValidFrom
  dateValidTo
`;

// formDefinition is an OrderedDjangoFilterConnectionField - always returns a connection
export const GET_FORM_DEFINITIONS = `
    query formDefinitions($name: String) {
        formDefinition(name_Icontains: $name) {
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

// Single form also uses the connection field filtered by uuid
export const GET_FORM_DEFINITION = `
    query formDefinition($uuid: UUID) {
        formDefinition(uuid: $uuid) {
            edges {
                node {
                    ${FORM_DEFINITION_FIELDS}
                }
            }
        }
    }
`;

export const CREATE_FORM_DEFINITION = `
    mutation createFormDefinition($input: CreateFormDefinitionMutationInput!) {
        createFormDefinition(input: $input) {
            clientMutationId
        }
    }
`;

export const UPDATE_FORM_DEFINITION = `
    mutation updateFormDefinition($input: UpdateFormDefinitionMutationInput!) {
        updateFormDefinition(input: $input) {
            clientMutationId
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

const FORM_SUBMISSION_FIELDS = `
  id
  uuid
  form {
    uuid
    name
  }
  submissionData
  status
  submittedBy {
    id
    username
  }
  dateSubmitted
  dateValidFrom
  dateValidTo
`;

export const GET_FORM_SUBMISSIONS = `
    query formSubmissions($formUuid: UUID) {
        formSubmission(form_Uuid: $formUuid) {
            edges {
                node {
                    ${FORM_SUBMISSION_FIELDS}
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

export const GET_FORM_SUBMISSION = `
    query formSubmission($uuid: UUID) {
        formSubmission(uuid: $uuid) {
            edges {
                node {
                    ${FORM_SUBMISSION_FIELDS}
                }
            }
        }
    }
`;

export const CREATE_FORM_SUBMISSION = `
    mutation createFormSubmission($input: CreateFormSubmissionMutationInput!) {
        createFormSubmission(input: $input) {
            clientMutationId
        }
    }
`;

export const UPDATE_FORM_SUBMISSION = `
    mutation updateFormSubmission($input: UpdateFormSubmissionMutationInput!) {
        updateFormSubmission(input: $input) {
            clientMutationId
        }
    }
`;

export const DELETE_FORM_SUBMISSION = `
    mutation deleteFormSubmission($input: DeleteFormSubmissionMutationInput!) {
        deleteFormSubmission(input: $input) {
            clientMutationId
        }
    }
`;
