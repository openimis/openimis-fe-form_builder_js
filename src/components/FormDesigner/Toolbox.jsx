import { useDraggable } from "@dnd-kit/core";
import { GetIconComponent } from "@openimis/fe-core";
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { FIELD_TYPES } from "../../constants";

const CheckBoxIcon = GetIconComponent("CheckBox");
const DateRangeIcon = GetIconComponent("DateRange");
const ListIcon = GetIconComponent("List");
const NumbersIcon = GetIconComponent("Numbers");
const TextFieldsIcon = GetIconComponent("TextFields");

const DraggableItem = ({ type, label, icon }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `toolbox-${type}`,
        data: { type, label, isToolboxItem: true },
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <ListItem
            button
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
        </ListItem>
    );
};

const Toolbox = () => {
    return (
        <List>
            <DraggableItem type={FIELD_TYPES.TEXT} label="Text Input" icon={<TextFieldsIcon />} />
            <DraggableItem type={FIELD_TYPES.NUMBER} label="Number Input" icon={<NumbersIcon />} />
            <DraggableItem type={FIELD_TYPES.DATE} label="Date Picker" icon={<DateRangeIcon />} />
            <DraggableItem type={FIELD_TYPES.BOOLEAN} label="Checkbox" icon={<CheckBoxIcon />} />
            <DraggableItem type={FIELD_TYPES.SELECT} label="Dropdown" icon={<ListIcon />} />
        </List>
    );
};

export default Toolbox;
