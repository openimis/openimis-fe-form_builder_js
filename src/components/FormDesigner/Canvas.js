import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Typography } from "@mui/material";
import QuestionItem from "./QuestionItem";

const Canvas = ({ fields, onSelectField, onDeleteField, selectedFieldId }) => {
    const { setNodeRef } = useDroppable({
        id: "canvas-droppable",
    });

    return (
        <Box
            ref={setNodeRef}
            style={{
                minHeight: 400,
                backgroundColor: "#f5f5f5",
                padding: 20,
                border: "1px dashed #ccc",
            }}
        >
            {fields.length === 0 ? (
                <Typography variant="body1" color="textSecondary" align="center" style={{ marginTop: 150 }}>
                    Drag and drop items here
                </Typography>
            ) : (
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field) => (
                        <QuestionItem
                            key={field.id}
                            id={field.id}
                            field={field}
                            onSelect={onSelectField}
                            onDelete={onDeleteField}
                            isSelected={selectedFieldId === field.id}
                        />
                    ))}
                </SortableContext>
            )}
        </Box>
    );
};

export default Canvas;
