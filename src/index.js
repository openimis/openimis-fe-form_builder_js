import BuildIcon from "@mui/icons-material/Build";
import FormDesigner from "./components/FormDesigner";
import FormRenderer from "./components/FormRenderer";
import FormSearcher from "./components/FormSearcher";
import FormViewerSearcher from "./components/FormViewer/FormViewerSearcher";
import { formBuilderReducer } from "./reducer";
import messages_en from "./translations/en.json";

export { FormDesigner, FormRenderer };

const DEFAULT_CONFIG = {
    "reducers": [{ key: "formBuilder", reducer: formBuilderReducer }],
    "core.Router": [
        { path: "form-builder", component: FormSearcher, exact: true },
        { path: "form-builder/:uuid?", component: FormDesigner },
        // Dynamic Data Extracted Modules
        { path: "forms/:uuid", component: FormViewerSearcher, exact: true },
        { path: "forms/:uuid/entry/:entryId?", component: FormRenderer }
    ],
    "admin.MainMenu": [
        {
            text: "Form Builder",
            icon: <BuildIcon />,
            route: "/form-builder",
            id: "admin.formBuilder",
        },
    ],
    "translations": [{ key: "en", messages: messages_en }],
    "refs": [
        { key: "formBuilder.new", ref: "form-builder/new" },
        { key: "formBuilder.edit", ref: "form-builder" },
        { key: "formBuilder.list", ref: "form-builder" },
        { key: "formBuilder.view", ref: "forms" },
    ],
};

export const FormBuilderModule = (cfg) => {
    return {
        ...DEFAULT_CONFIG,
        ...cfg,
        reducer: {
            ...cfg.reducer,
            formBuilder: formBuilderReducer,
        },
    };
};
