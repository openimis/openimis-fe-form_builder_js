import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Typography
} from '@mui/material';
import {
    formatDateTimeFromISO,
    SearcherPane,
    useModulesManager,
    useTranslations
} from '@openimis/fe-core';
import { useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
    useFormDataDeleteMutation,
    useFormDataListQuery,
    useFormDefinitionQuery
} from '../../hooks';

const FormViewerSearcher = () => {
    const { uuid } = useParams();
    const history = useHistory();
    const modulesManager = useModulesManager();
    const { formatMessage } = useTranslations('formBuilder', modulesManager);

    // Fetch exactly what this form expects
    const { data: formDefinition, isLoading: schemaLoading } = useFormDefinitionQuery(uuid, { skip: !uuid });

    // Fetch entries currently saved to it
    const { data: entries, isLoading: dataLoading, refetch } = useFormDataListQuery(uuid, { skip: !uuid });
    const { mutate: deleteEntry } = useFormDataDeleteMutation();

    const handleCreate = () => {
        history.push(`/forms/${uuid}/entry/new`);
    };

    const handleEdit = (rowData) => {
        history.push(`/front/forms/${uuid}/entry/${rowData.id}`);
    };

    const handleDelete = (rowData) => {
        if (window.confirm(formatMessage("formBuilder.actions.confirmDelete", "Are you sure you want to delete this entry?"))) {
            deleteEntry(
                { formUuid: uuid, id: rowData.id },
                {
                    onSuccess: () => refetch(),
                    onError: (err) => console.error(err)
                }
            );
        }
    };

    // Convert the generated schema into a TableService compatible structure
    const columns = useMemo(() => {
        if (!formDefinition?.schema) return [];

        // Default system columns
        const cols = [
            {
                title: formatMessage('formBuilder.fields.id', 'ID'),
                field: 'id',
                width: '120px'
            }
        ];

        // Dynamic columns from schema
        formDefinition.schema.forEach((field) => {
            cols.push({
                title: field.label || field.name,
                field: field.name
            });
        });

        // Append standard timestamp
        cols.push({
            title: formatMessage('formBuilder.fields.createdAt', 'Created At'),
            field: 'createdAt',
            render: (rowData) => rowData.createdAt ? formatDateTimeFromISO(rowData.createdAt) : ''
        });

        return cols;
    }, [formDefinition, formatMessage]);

    const actions = useMemo(() => [
        {
            icon: 'edit',
            tooltip: formatMessage('formBuilder.actions.edit', 'Edit'),
            onClick: (event, rowData) => handleEdit(rowData)
        },
        {
            icon: 'delete',
            tooltip: formatMessage('formBuilder.actions.delete', 'Delete'),
            onClick: (event, rowData) => handleDelete(rowData)
        }
    ], [formatMessage]);

    if (schemaLoading || dataLoading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (!formDefinition) {
        return (
            <Box p={4}>
                <Typography color="error">
                    {formatMessage('formBuilder.errorLoading', 'Error loading form definition.')}
                </Typography>
            </Box>
        );
    }

    const schemaFields = formDefinition?.schema || [];

    const headerActions = useMemo(() => [
        {
            icon: <i className="material-icons">add</i>,
            label: formatMessage('formBuilder.actions.createEntry', 'Create Entry'),
            action: handleCreate
        }
    ], [formatMessage, handleCreate]);

    return (
        <SearcherPane
            title={`${formDefinition.name} - Data Overview`}
            actions={headerActions}
            resultsPane={
                <Paper elevation={0} style={{ width: '100%', overflowX: 'auto' }}>
                    <Box component="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <Box component="thead" style={{ borderBottom: '2px solid #ddd' }}>
                            <tr>
                                <Box component="th" p={2}>{formatMessage('formBuilder.fields.id', 'ID')}</Box>
                                {schemaFields.map(field => (
                                    <Box component="th" p={2} key={field.name}>{field.label || field.name}</Box>
                                ))}
                                <Box component="th" p={2}>{formatMessage('formBuilder.fields.createdAt', 'Created At')}</Box>
                                <Box component="th" p={2}>Actions</Box>
                            </tr>
                        </Box>
                        <Box component="tbody">
                            {(!entries || entries.length === 0) ? (
                                <tr>
                                    <Box component="td" p={2} colSpan={schemaFields.length + 3} textAlign="center">
                                        {formatMessage('formBuilder.noData', 'No data entries found.')}
                                    </Box>
                                </tr>
                            ) : entries.map(row => (
                                <Box component="tr" key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <Box component="td" p={2}>{(row.id || "").substring(0, 8)}...</Box>

                                    {schemaFields.map(field => (
                                        <Box component="td" p={2} key={field.name}>{row[field.name]?.toString() || ''}</Box>
                                    ))}

                                    <Box component="td" p={2}>{row.createdAt ? formatDateTimeFromISO(row.createdAt) : ''}</Box>

                                    <Box component="td" p={2}>
                                        <Button
                                            color="primary"
                                            size="small"
                                            onClick={() => history.push(`/forms/${uuid}/entry/${row.id}`)}
                                        >
                                            {formatMessage('formBuilder.actions.edit', 'Edit')}
                                        </Button>
                                        <Button
                                            color="secondary"
                                            size="small"
                                            onClick={() => {
                                                if (window.confirm("Are you sure?")) {
                                                    deleteEntry(
                                                        { formUuid: uuid, id: row.id },
                                                        { onSuccess: () => refetch() }
                                                    );
                                                }
                                            }}
                                        >
                                            {formatMessage('formBuilder.actions.delete', 'Delete')}
                                        </Button>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Paper>
            }
        />
    );
};

export default FormViewerSearcher;
