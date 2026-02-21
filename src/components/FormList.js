import { Add as AddIcon } from "@mui/icons-material";
import { Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    combine,
    historyPush,
    useModulesManager,
    useTranslations,
    withHistory,
    withTooltip,
} from "@openimis/fe-core";
import { useSelector } from "react-redux";
import FormSearcher from "./FormSearcher";

const StyledPage = styled("div")(({ theme }) => ({
    ...theme.page ?? {},
}));

const StyledFab = styled("div")(({ theme }) => ({
    ...theme.fab ?? {},
}));

const FormList = (props) => {
    const { history } = props;
    const modulesManager = useModulesManager();
    const { formatMessage } = useTranslations("formBuilder", modulesManager);
    const rights = useSelector((state) => state.core.user?.i_user?.rights ?? []);

    // TODO: Add proper right check for creating forms
    const canCreate = true; // rights.includes(RIGHT_FORM_ADD);

    return (
        <StyledPage>
            <FormSearcher history={history} />
            {canCreate &&
                withTooltip(
                    <StyledFab>
                        <Fab
                            color="primary"
                            onClick={() => historyPush(modulesManager, history, "formBuilder.new")}
                        >
                            <AddIcon />
                        </Fab>
                    </StyledFab>,
                    formatMessage("formBuilder.actions.create", "Create New Form")
                )}
        </StyledPage>
    );
};

const enhance = combine(withHistory);
export default enhance(FormList);
