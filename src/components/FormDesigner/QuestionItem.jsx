import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Grid, IconButton, Paper, Typography } from "@mui/material";

const QuestionItem = ({ id, field, onSelect, onDelete, isSelected }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: 10,
        marginBottom: 10,
        border: isSelected ? "2px solid #1976d2" : "1px solid #e0e0e0",
        cursor: "pointer",
        backgroundColor: "#fff",
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            onClick={() => onSelect(field)}
            elevation={isSelected ? 3 : 1}
        >
            <Grid container alignItems="center">
                <Grid item xs={1} {...attributes} {...listeners} style={{ cursor: "grab" }}>
                    <DragIndicatorIcon color="action" />
                </Grid>
                <Grid item xs={10}>
                    <Typography variant="subtitle1">{field.label || "Untitled Question"}</Typography>
                    <Typography variant="caption" color="textSecondary">
                        Type: {field.type}
                    </Typography>
                </Grid>
                <Grid item xs={1}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default QuestionItem;
