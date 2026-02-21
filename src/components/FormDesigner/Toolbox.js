import { useDraggable } from "@dnd-kit/core";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ListIcon from "@mui/icons-material/List";
import NumbersIcon from "@mui/icons-material/Numbers";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { FIELD_TYPES } from "../../constants";

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
