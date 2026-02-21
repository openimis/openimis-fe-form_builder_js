import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { Button, Grid, Paper, Typography } from "@mui/material";
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

import { Fab } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledPage = styled("div")(({ theme }) => ({
    ...theme.page ?? {},
    padding: theme.spacing(3),
    position: "relative", // For FAB positioning
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

    // TODO: Add proper rights check
    const canEdit = true;

    const [edited, setEdited] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    const { isLoading, error, data } = useFormDefinitionQuery(
        uuid,
        { skip: !uuid }
    );

    // const createMutation = useFormDefinitionCreateMutation();
    // const updateMutation = useFormDefinitionUpdateMutation();
    const createMutation = useFormDefinitionCreateMutation();
    const updateMutation = useFormDefinitionUpdateMutation();

    useEffect(() => {
        setIsLoaded(false);
    }, [uuid]);

    useEffect(() => {
        if (!uuid && !isLoaded) {
            setEdited({
                name: "",
                description: "",
                formType: "standalone",
                entryPoint: "",
                schema: [],
                targetModel: "",
            });
            setIsLoaded(true);
        } else if (uuid && !isLoading && data && !isLoaded) {
            setEdited(data);
            setIsLoaded(true);
        }
    }, [data, isLoading, uuid, isLoaded]);

    const onSave = () => {
        const payload = {
            name: edited.name,
            description: edited.description || "",
            formType: edited.formType || "standalone",
            entryPoint: edited.entryPoint || "",
            schema: JSON.stringify(edited.schema || []),
            targetModel: edited.targetModel || "",
        };
        const variables = uuid ? { uuid, ...payload } : { ...payload };
        const mutation = uuid ? updateMutation : createMutation;

        mutation.mutate(
            variables,
            {
                onSuccess: (result) => {
                    if (result) {
                        historyPush(modulesManager, history, "formBuilder.list");
                    }
                },
                onError: (e) => {
                    console.error("Save failed:", e);
                },
            }
        );
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
                            {uuid
                                ? formatMessage("formBuilder.editForm", { name: edited.name })
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
