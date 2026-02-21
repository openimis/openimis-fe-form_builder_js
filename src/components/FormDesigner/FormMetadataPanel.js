import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    TextInput,
    combine,
    useModulesManager,
    useTranslations,
    withModulesManager,
} from "@openimis/fe-core";

const StyledItem = styled("div")(({ theme }) => ({
    ...theme.paper?.item ?? {},
}));

const FormMetadataPanel = (props) => {
    const { edited, onEditedChanged, readOnly } = props;
    const modulesManager = useModulesManager();
    const { formatMessage } = useTranslations("formBuilder", modulesManager);

    return (
        <Grid container direction="row">
            <Grid item xs={12} md={6} component={StyledItem}>
                <TextInput
                    module="formBuilder"
                    required
                    label="name"
                    readOnly={readOnly}
                    value={edited?.name ?? ""}
                    onChange={(name) => onEditedChanged({ ...edited, name })}
                />
            </Grid>
            <Grid item xs={12} md={6} component={StyledItem}>
                <TextInput
                    module="formBuilder"
                    label="description"
                    readOnly={readOnly}
                    value={edited?.description ?? ""}
                    onChange={(description) => onEditedChanged({ ...edited, description })}
                />
            </Grid>
        </Grid>
    );
};

const enhance = combine(withModulesManager);
export default enhance(FormMetadataPanel);
