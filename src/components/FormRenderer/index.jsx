import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Grid,
    Paper,
    Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    GRID_RESPONSIVE_FULL,
    NumberInput,
    PublishedComponent,
    SelectInput,
    TextInput,
    useModulesManager,
    useTranslations,
} from "@openimis/fe-core";
import React from 'react';
import { useHistory, useParams } from "react-router-dom";
import {
    useFormDataCreateMutation,
    useFormDataQuery,
    useFormDataUpdateMutation,
    useFormDefinitionQuery
} from "../../hooks";

const StyledGrid = styled(Grid)(({ theme }) => ({
    '& .tableTitle': theme?.table?.title ?? {},
    '& .item': theme?.paper?.item ?? {},
    '& .fullHeight': {
        height: "100%",
    },
}));

const FormRenderer = () => {
    const { uuid, entryId } = useParams();
    const history = useHistory();
    const modulesManager = useModulesManager();
    const { formatMessage } = useTranslations("formBuilder", modulesManager);

    const [formState, setFormState] = React.useState({});

    const { data: formDefinition, isLoading, error } = useFormDefinitionQuery(uuid, {
        skip: !uuid,
    });

    const { data: existingEntry, isLoading: entryLoading } = useFormDataQuery(uuid, entryId, {
        skip: !uuid || !entryId
    });

    const { mutate: createEntry } = useFormDataCreateMutation();
    const { mutate: updateEntry } = useFormDataUpdateMutation();

    React.useEffect(() => {
        if (existingEntry) {
            setFormState(existingEntry);
        }
    }, [existingEntry]);

    const handleFieldChange = (name, value) => {
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (entryId && entryId !== 'new') {
            updateEntry(
                { formUuid: uuid, id: entryId, ...formState },
                { onSuccess: () => history.replace(`/forms/${uuid}`) }
            );
        } else {
            createEntry(
                { formUuid: uuid, ...formState },
                { onSuccess: () => history.replace(`/forms/${uuid}`) }
            );
        }
    };

    if (isLoading || entryLoading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || (!isLoading && !formDefinition)) {
        return (
            <Box p={4}>
                <Typography color="error">
                    {formatMessage("formBuilder.errorLoading", "Error loading form definition.")}
                </Typography>
            </Box>
        );
    }

    const { name, description, schema } = formDefinition;

    const renderField = (field) => {
        const { id, type, label, name: fieldName, required } = field;

        switch (type) {
            case "text":
                return (
                    <Grid item {...GRID_RESPONSIVE_FULL} className="item" key={id}>
                        <TextInput
                            module="formBuilder"
                            label={label || fieldName}
                            name={fieldName}
                            required={required}
                            value={formState[fieldName] || ''}
                            onChange={(val) => handleFieldChange(fieldName, val)}
                        />
                    </Grid>
                );
            case "number":
                return (
                    <Grid item {...GRID_RESPONSIVE_FULL} className="item" key={id}>
                        <NumberInput
                            module="formBuilder"
                            label={label || fieldName}
                            name={fieldName}
                            required={required}
                            value={formState[fieldName] || ''}
                            onChange={(val) => handleFieldChange(fieldName, val)}
                        />
                    </Grid>
                );
            case "date":
                return (
                    <Grid item {...GRID_RESPONSIVE_FULL} className="item" key={id}>
                        <PublishedComponent
                            pubRef='core.DatePicker'
                            module="formBuilder"
                            label={label || fieldName}
                            name={fieldName}
                            required={required}
                            value={formState[fieldName] || null}
                            onChange={(val) => handleFieldChange(fieldName, val)}
                        />
                    </Grid>
                );
            case "boolean":
                return (
                    <Grid item {...GRID_RESPONSIVE_FULL} className="item" key={id} style={{ display: 'flex', alignItems: 'center', height: '100%', minHeight: '60px' }}>
                        <FormControlLabel
                            control={<Checkbox name={fieldName} required={required} color="primary" checked={!!formState[fieldName]} onChange={(e) => handleFieldChange(fieldName, e.target.checked)} />}
                            label={label || fieldName}
                        />
                    </Grid>
                );
            case "select": {
                // Determine options array from schema (handles string "A, B" or [string] or [{label, value}] formats)
                let rawOptions = field.options || field.properties?.options || field.optionsCsv || [];
                if (typeof rawOptions === 'string') {
                    rawOptions = rawOptions.split(',').map(s => s.trim()).filter(Boolean);
                }

                const formattedOptions = (Array.isArray(rawOptions) ? rawOptions : []).map(opt => {
                    if (typeof opt === 'string') return { label: opt, value: opt };
                    return { label: opt.label || opt.lbl || opt.value || opt.val, value: opt.value || opt.val || opt.id };
                });

                return (
                    <Grid item {...GRID_RESPONSIVE_FULL} className="item" key={id}>
                        <SelectInput
                            module="formBuilder"
                            label={label || fieldName}
                            name={fieldName}
                            required={required}
                            options={formattedOptions}
                            value={formState[fieldName] !== undefined ? formState[fieldName] : null}
                            onChange={(val) => handleFieldChange(fieldName, val)}
                        />
                    </Grid>
                );
            }
            default:
                return (
                    <Grid item {...GRID_RESPONSIVE_FULL} className="item" key={id}>
                        <Typography color="error">
                            Unsupported field type: {type}
                        </Typography>
                    </Grid>
                );
        }
    };

    return (
        <Paper style={{ margin: "24px auto", maxWidth: 800 }}>
            <Box p={4}>
                <Typography variant="h4" gutterBottom>
                    {name || "Untitled Form"}
                </Typography>
                {description && (
                    <Typography variant="body1" color="textSecondary" paragraph>
                        {description}
                    </Typography>
                )}

                <form onSubmit={handleFormSubmit}>
                    <StyledGrid container spacing={2}>
                        {schema && schema.length > 0 ? (
                            schema.map((field) => renderField(field))
                        ) : (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary" style={{ marginTop: 20 }}>
                                    {formatMessage("formBuilder.noSchema", "No form fields defined.")}
                                </Typography>
                            </Grid>
                        )}
                    </StyledGrid>

                    <Box mt={4} display="flex" justifyContent="flex-end">
                        <Button variant="contained" color="primary" type="submit">
                            {formatMessage("formBuilder.actions.submit", "Submit")}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Paper>
    );
};

export default FormRenderer;
