import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { Button, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    ConfirmDialog,
    Searcher,
    combine,
    historyPush,
    useModulesManager,
    useTranslations,
    withHistory,
} from "@openimis/fe-core";
import { useCallback, useState } from "react";
import { useFormDefinitionDeleteMutation, useFormDefinitionsQuery } from "../hooks";
import FormFilters from "./FormFilters";

const StyledHorizontalButtonContainer = styled("div")(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(1),
}));

const FormSearcher = (props) => {
    const { history } = props;
    const modulesManager = useModulesManager();
    const { formatMessage, formatMessageWithValues } = useTranslations(
        "formBuilder",
        modulesManager
    );
    const [filters, setFilters] = useState({});
    const [formToDelete, setFormToDelete] = useState(null);
    const { data, isLoading, error, refetch } = useFormDefinitionsQuery(
        { filters },
        { skip: true, keepStale: true }
    );
    const deleteMutation = useFormDefinitionDeleteMutation();

    const filtersToQueryParam = useCallback((state) => {
        let params = {};
        if (!state.beforeCursor && !state.afterCursor) {
            params = { first: state.pageSize };
        }
        if (state.afterCursor) {
            params = {
                after: state.afterCursor,
                first: state.pageSize,
            };
        }
        if (state.beforeCursor) {
            params = {
                before: state.beforeCursor,
                last: state.pageSize,
            };
        }
        Object.entries(state.filters).forEach(([filterKey, filter]) => {
            params[filterKey] = filter.filter ?? filter.value;
        });
        return params;
    }, []);

    const getHeaders = useCallback(
        () => [
            "formBuilder.name",
            "formBuilder.status",
            "formBuilder.description",
            "",
        ],
        []
    );

    const getAligns = useCallback(() => {
        const aligns = getHeaders().map(() => null);
        aligns.splice(-1, 1, "right");
        return aligns;
    }, []);

    const onDeleteConfirm = async (isConfirmed) => {
        if (isConfirmed && formToDelete) {
            await deleteMutation.mutate({ uuid: formToDelete.uuid });
            refetch();
        }
        setFormToDelete(null);
    };

    const onEdit = (form) => {
        historyPush(modulesManager, history, "formBuilder.edit", [form.uuid]);
    };

    const onView = (form) => {
        historyPush(modulesManager, history, "formBuilder.view", [form.uuid]);
    };

    const onCreate = () => {
        historyPush(modulesManager, history, "formBuilder.new");
    };

    const itemFormatters = useCallback((filters) => {
        return [
            (f) => f.name,
            (f) => f.status,
            (f) => f.description,
            (f) => (
                <StyledHorizontalButtonContainer>
                    <Tooltip title={formatMessage("formBuilder.actions.view")}>
                        <Button startIcon={<ViewIcon />} onClick={() => onView(f)}>
                            {formatMessage("formBuilder.actions.view")}
                        </Button>
                    </Tooltip>
                    <Tooltip title={formatMessage("formBuilder.actions.edit")}>
                        <Button startIcon={<EditIcon />} onClick={() => onEdit(f)}>
                            {formatMessage("formBuilder.actions.edit")}
                        </Button>
                    </Tooltip>
                    <Tooltip title={formatMessage("formBuilder.actions.delete")}>
                        <Button startIcon={<DeleteIcon />} onClick={() => setFormToDelete(f)}>
                            {formatMessage("formBuilder.actions.delete")}
                        </Button>
                    </Tooltip>
                </StyledHorizontalButtonContainer>
            ),
        ];
    }, []);

    const searcherActions = [
        {
            label: formatMessage("formBuilder.actions.create", "Create"),
            icon: <AddIcon />,
            authorized: true, // TODO: add specific right check if needed later, openIMIS handles this per module config generally
            onClick: onCreate,
        },
    ];

    return (
        <>
            {formToDelete && (
                <ConfirmDialog
                    confirm={{
                        title: formatMessage("deleteFormDialog.title", "Delete Form"),
                        message: formatMessageWithValues("deleteFormDialog.message", {
                            name: formToDelete.name,
                        }, "Are you sure you want to delete {name}?"),
                    }}
                    onConfirm={onDeleteConfirm}
                />
            )}
            <Searcher
                module="formBuilder"
                tableTitle={formatMessageWithValues("formBuilder.tableTitle", {
                    count: data?.pageInfo?.totalCount ?? 0,
                }, "Forms ({count})")}
                items={data.formDefinitions}
                fetchingItems={isLoading}
                errorItems={error}
                itemsPageInfo={data.pageInfo}
                fetch={setFilters}
                FilterPane={FormFilters}
                headers={getHeaders}
                aligns={getAligns}
                rowIdentifier={(r) => r.uuid}
                filtersToQueryParams={filtersToQueryParam}
                itemFormatters={itemFormatters}
                searcherActions={searcherActions}
                enableActionButtons
            />
        </>
    );
};

const enhance = combine(withHistory);
export default enhance(FormSearcher);
