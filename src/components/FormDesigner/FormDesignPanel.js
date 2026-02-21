import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Canvas from "./Canvas";
import PropertiesPanel from "./PropertiesPanel";
import QuestionItem from "./QuestionItem";
import Toolbox from "./Toolbox";

const FormDesignPanel = (props) => {
    const { edited, onEditedChanged, readOnly } = props;

    if (!edited) return null;

    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [activeDragItem, setActiveDragItem] = useState(null);

    // Ensure fields is always an array
    const fields = edited?.schema || [];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveDragItem(active.data.current);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        let newFields = [...fields];

        // Dropping from Toolbox to Canvas
        if (active.data.current?.isToolboxItem && over.id === "canvas-droppable") {
            const newField = {
                id: uuidv4(),
                type: active.data.current.type,
                label: active.data.current.label,
                name: `field_${fields.length + 1}`,
                required: false,
            };
            newFields = [...fields, newField];
            setSelectedFieldId(newField.id);
        }
        // Sorting within Canvas
        else if (active.id !== over.id && !active.data.current?.isToolboxItem) {
            const oldIndex = fields.findIndex((i) => i.id === active.id);
            const newIndex = fields.findIndex((i) => i.id === over.id);
            newFields = arrayMove(fields, oldIndex, newIndex);
        }

        onEditedChanged({ ...edited, schema: newFields });
    };

    const handleSelectField = (field) => {
        setSelectedFieldId(field.id);
    };

    const handleDeleteField = (id) => {
        const newFields = fields.filter((f) => f.id !== id);
        onEditedChanged({ ...edited, schema: newFields });
        if (selectedFieldId === id) {
            setSelectedFieldId(null);
        }
    };

    const handleFieldChange = (updatedField) => {
        const newFields = fields.map((f) => (f.id === updatedField.id ? updatedField : f));
        onEditedChanged({ ...edited, schema: newFields });
    };

    const selectedField = fields.find((f) => f.id === selectedFieldId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Grid container spacing={2} wrap="nowrap" style={{ padding: 20, height: "calc(100vh - 200px)" }}>
                <Grid item xs={3}>
                    <Paper style={{ padding: 10, height: "100%" }}>
                        <Typography variant="h6" gutterBottom>
                            Toolbox
                        </Typography>
                        <Toolbox />
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper style={{ padding: 10, height: "100%", overflowY: "auto" }}>
                        <Typography variant="h6" gutterBottom>
                            Canvas
                        </Typography>
                        <Canvas
                            fields={fields}
                            onSelectField={handleSelectField}
                            onDeleteField={handleDeleteField}
                            selectedFieldId={selectedFieldId}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={{ padding: 10, height: "100%" }}>
                        <PropertiesPanel field={selectedField} onChange={handleFieldChange} />
                    </Paper>
                </Grid>
            </Grid>
            <DragOverlay>
                {activeDragItem ? (
                    activeDragItem.isToolboxItem ? (
                        <Paper style={{ padding: 10 }}>{activeDragItem.label}</Paper>
                    ) : (
                        <QuestionItem field={activeDragItem} isSelected={false} />
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default FormDesignPanel;
