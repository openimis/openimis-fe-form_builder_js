import { Box, Checkbox, CircularProgress, FormControlLabel, TextField, Typography } from "@mui/material";
import { useFormControlsSchemaQuery } from "../../hooks";

const PropertiesPanel = ({ field, onChange }) => {
    const { data: schema, isLoading } = useFormControlsSchemaQuery();

    if (!field) {
        return (
            <Box p={2}>
                <Typography variant="body2" color="textSecondary">
                    Select a field to edit properties
                </Typography>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box p={2} display="flex" justifyContent="center">
                <CircularProgress size={24} />
            </Box>
        );
    }

    const handleChange = (key, value) => {
        onChange({ ...field, [key]: value });
    };

    const fieldSchema = schema ? schema[field.type] : null;
    const properties = fieldSchema ? fieldSchema.properties : [];

    return (
        <Box p={2}>
            <Typography variant="h6" gutterBottom>
                Properties ({field.type})
            </Typography>

            {properties.map((prop) => {
                if (prop.type === "boolean") {
                    return (
                        <FormControlLabel
                            key={prop.name}
                            control={
                                <Checkbox
                                    checked={field[prop.name] || false}
                                    onChange={(e) => handleChange(prop.name, e.target.checked)}
                                />
                            }
                            label={prop.label}
                        />
                    );
                } else if (prop.type === "number") {
                    return (
                        <TextField
                            key={prop.name}
                            label={prop.label}
                            type="number"
                            fullWidth
                            margin="normal"
                            value={field[prop.name] !== undefined ? field[prop.name] : ""}
                            onChange={(e) => handleChange(prop.name, e.target.value === "" ? "" : Number(e.target.value))}
                        />
                    );
                } else {
                    // default to text
                    return (
                        <TextField
                            key={prop.name}
                            label={prop.label}
                            fullWidth
                            margin="normal"
                            value={field[prop.name] || ""}
                            onChange={(e) => handleChange(prop.name, e.target.value)}
                        />
                    );
                }
            })}

            {properties.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                    No properties available for this field type.
                </Typography>
            )}
        </Box>
    );
};

export default PropertiesPanel;
