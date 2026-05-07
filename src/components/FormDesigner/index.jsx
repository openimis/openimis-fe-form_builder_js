import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { Button, Fab, Grid, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { combine, historyPush, useModulesManager, useTranslations, withHistory } from "@openimis/fe-core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    useFormDefinitionCreateMutation,
    useFormDefinitionQuery,
    useFormDefinitionUpdateMutation
} from "../../hooks";
import FormDesignPanel from "./FormDesignPanel";
import FormMetadataPanel from "./FormMetadataPanel";

const StyledPage = styled("div")(({ theme }) => ({
    ...theme.page ?? {},
    padding: theme.spacing(3),
    position: "relative",
}));

const StyledFab = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(4),
    right: theme.spacing(4),
    zIndex: 1300,
}));

const FormDesigner = (props) => {
    const { history } = props;
    const { uuid } = useParams();
    const modulesManager = useModulesManager();
    const { formatMessage } = useTranslations("formBuilder", modulesManager);

    const canEdit = true;

    // uuid from useParams is "new" when navigating to /form-builder/new
    // treat "new" (or missing) as create mode; only existing uuids as edit mode
    const isEditing = !!uuid && uuid !== 'new';

    const [edited, setEdited] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    const { isLoading, data } = useFormDefinitionQuery(
        isEditing ? uuid : null,
        { skip: !isEditing }
    );

    const createMutation = useFormDefinitionCreateMutation();
    const updateMutation = useFormDefinitionUpdateMutation();

    useEffect(() => {
        setIsLoaded(false);
    }, [uuid]);

    useEffect(() => {
        if (!isEditing && !isLoaded) {
            setEdited({
                name: "",
                description: "",
                formType: "standalone",
                entryPoint: "",
                schema: [],
                targetModel: "",
            });
            setIsLoaded(true);
        } else if (isEditing && !isLoading && data && !isLoaded) {
            setEdited(data);
            setIsLoaded(true);
        }
    }, [data, isLoading, isEditing, isLoaded]);

    const onSave = () => {
        const payload = {
            name: edited.name,
            description: edited.description || "",
            formType: edited.formType || "standalone",
            entryPoint: edited.entryPoint || "",
            schema: typeof edited.schema !== 'string' ? JSON.stringify(edited.schema || []) : edited.schema,
            targetModel: edited.targetModel || "",
        };

        if (isEditing) {
            // Pass edited.id (relay global ID returned by the backend query) for update
            updateMutation.mutate(
                { id: edited.id, ...payload },
                {
                    onSuccess: () => historyPush(modulesManager, history, "formBuilder.list"),
                    onError: (e) => console.error("Update failed:", e),
                }
            );
        } else {
            createMutation.mutate(
                payload,
                {
                    onSuccess: () => historyPush(modulesManager, history, "formBuilder.list"),
                    onError: (e) => console.error("Create failed:", e),
                }
            );
        }
    };

    return (
        <StyledPage>
            <Grid container spacing={3} direction="column">
                <Grid item xs={12} container alignItems="center" spacing={2}>
                    <Grid item>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => historyPush(modulesManager, history, "formBuilder.list")}
                        >
                            {formatMessage("formBuilder.actions.back", "Back")}
                        </Button>
                    </Grid>
                    <Grid item>
                        <Typography variant="h5">
                            {isEditing
                                ? formatMessage("formBuilder.editForm", { name: edited.name || "" })
                                : formatMessage("formBuilder.createForm", "Create Form")}
                        </Typography>
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    <Paper style={{ padding: "16px" }}>
                        <FormMetadataPanel
                            edited={edited}
                            onEditedChanged={setEdited}
                            readOnly={!canEdit}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper style={{ padding: "0px", height: "calc(100vh - 250px)", overflow: "auto" }}>
                        <FormDesignPanel
                            edited={edited}
                            onEditedChanged={setEdited}
                            readOnly={!canEdit}
                        />
                    </Paper>
                </Grid>

                {canEdit && (
                    <StyledFab color="primary" aria-label="save" onClick={onSave}>
                        <SaveIcon />
                    </StyledFab>
                )}
            </Grid>
        </StyledPage>
    );
};

const enhance = combine(withHistory);
export default enhance(FormDesigner);
