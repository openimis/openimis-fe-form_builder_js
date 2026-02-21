# OpenIMIS Frontend Form Builder Module

## Introduction
The `@openimis/fe-form-builder` module provides a drag-and-drop interface for designing dynamic forms and a renderer for displaying them. It allows system administrators and configurators to create custom forms without writing code.

## Installation

Install the module and its peer dependencies:

```bash
npm install @openimis/fe-form-builder
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities uuid
```

## Configuration

### 1. Vite Configuration
Ensure the module is aliased in your `vite.config.js`:

```javascript
resolve: {
  alias: {
    "@openimis/fe-form-builder": path.resolve('../frontend-packages/FormBuilderModule', 'src'),
    // ... other aliases
  }
}
```

### 2. Module Registration
Register the module in your application entry point (e.g., `modules.js` or `index.js` of the shell app):

```javascript
import * as FormBuilderModule from "@openimis/fe-form-builder";

// ... inside module registration logic
registerModule("form-builder", FormBuilderModule);
```

## Usage

### Form Designer
Access the form designer at the default route:
`http://<your-domain>/form-builder`

To edit an existing form:
`http://<your-domain>/form-builder/:uuid`

### Form Renderer
To render a form by its UUID:
`http://<your-domain>/forms/:uuid`

Or use the component directly:

```jsx
import { FormRenderer } from "@openimis/fe-form-builder";

<FormRenderer uuid="1234-5678-..." />
```

## Features

- **Toolbox**: Drag-and-drop standard HTML5 inputs (Text, Number, Date, Checkbox, Select).
- **Canvas**: Visual representation of the form structure. Reorder fields using drag handles.
- **Properties Panel**: Configure field labels, variable names, and validation rules (e.g., Required).

## Backend Integration
This frontend module relies on the `openimis-be-form_builder_py` backend module. It communicates via GraphQL queries defined in `src/queries.js`.

Ensure your backend provides the `formDefinitions` query and `createFormDefinition`/`updateFormDefinition` mutations.
