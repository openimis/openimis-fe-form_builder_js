import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    combine,
    ControlledField,
    TextInput,
    useDebounceCb,
    useTranslations,
    withModulesManager
} from "@openimis/fe-core";

const StyledForm = styled("section")(({ theme }) => ({
    padding: "0 0 10px 0",
    width: "100%",
}));

const StyledItem = styled("div")(({ theme }) => ({
    padding: theme.spacing(1),
}));

const FormFilters = (props) => {
    const { filters, onChangeFilters, modulesManager } = props;
    const { formatMessage } = useTranslations("formBuilder", modulesManager);

    const onValueChange = (id, value) => {
        onChangeFilters([{ id, value }]);
    };

    const onChangeDebounce = useDebounceCb(
        onValueChange,
        modulesManager.getConf("fe-admin", "debounceTime", 200)
    );

    return (
        <StyledForm>
            <Grid container>
                <ControlledField
                    module="formBuilder"
                    id="name"
                    field={
                        <Grid item xs={12} sm={6} md={4} component={StyledItem}>
                            <TextInput
                                module="formBuilder"
                                name="name"
                                label="name"
                                value={filters?.name?.value || ""}
                                onChange={(value) => onChangeDebounce("name", value)}
                            />
                        </Grid>
                    }
                />
            </Grid>
        </StyledForm>
    );
};

const enhance = combine(withModulesManager);

export { StyledForm };
export default enhance(FormFilters);
