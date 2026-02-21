import { Route, Switch } from "react-router-dom";
import FormDesigner from "./components/FormDesigner";
import FormRenderer from "./components/FormRenderer"; // Assuming this handles listing or specific form rendering

const FormBuilderRoutes = () => {
    return (
        <Switch>
            <Route exact path="/form-builder" component={FormDesigner} />
            <Route path="/form-builder/:uuid" component={FormDesigner} />
            <Route path="/forms/:uuid" component={FormRenderer} />
        </Switch>
    );
};

export default FormBuilderRoutes;
