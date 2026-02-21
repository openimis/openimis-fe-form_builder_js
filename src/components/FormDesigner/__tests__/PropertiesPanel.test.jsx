import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as hooks from '../../../hooks';
import PropertiesPanel from '../PropertiesPanel';

vi.mock('../../../hooks', () => ({
    useFormControlsSchemaQuery: vi.fn()
}));

describe('PropertiesPanel', () => {
    const mockSchema = {
        text: {
            label: 'Text Input',
            properties: [
                { name: 'label', type: 'string', label: 'Label' },
                { name: 'required', type: 'boolean', label: 'Required' }
            ]
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders loading state when schema is loading', () => {
        hooks.useFormControlsSchemaQuery.mockReturnValue({ isLoading: true, data: null });
        render(<PropertiesPanel field={{ type: 'text' }} onChange={() => { }} />);
        expect(screen.getByRole('progressbar')).toBeTruthy();
    });

    it('renders prompt when no field is selected', () => {
        hooks.useFormControlsSchemaQuery.mockReturnValue({ isLoading: false, data: mockSchema });
        render(<PropertiesPanel field={null} onChange={() => { }} />);
        expect(screen.getByText('Select a field to edit properties')).toBeTruthy();
    });

    it('renders properties based on schema for selected field', () => {
        hooks.useFormControlsSchemaQuery.mockReturnValue({ isLoading: false, data: mockSchema });
        const field = { type: 'text', label: 'My Label', required: true };

        render(<PropertiesPanel field={field} onChange={() => { }} />);

        expect(screen.getByText('Properties (text)')).toBeTruthy();
        expect(screen.getByLabelText('Label').value).toBe('My Label');
        expect(screen.getByLabelText('Required').checked).toBe(true);
    });

    it('calls onChange with updated field property when a text field is changed', () => {
        hooks.useFormControlsSchemaQuery.mockReturnValue({ isLoading: false, data: mockSchema });
        const field = { type: 'text', label: 'My Label', required: true };
        const mockOnChange = vi.fn();

        render(<PropertiesPanel field={field} onChange={mockOnChange} />);

        const input = screen.getByLabelText('Label');
        fireEvent.change(input, { target: { value: 'New Label' } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...field,
            label: 'New Label'
        });
    });

    it('calls onChange with updated field property when a checkbox is toggled', () => {
        hooks.useFormControlsSchemaQuery.mockReturnValue({ isLoading: false, data: mockSchema });
        const field = { type: 'text', label: 'My Label', required: true };
        const mockOnChange = vi.fn();

        render(<PropertiesPanel field={field} onChange={mockOnChange} />);

        const checkbox = screen.getByLabelText('Required');
        fireEvent.click(checkbox);

        expect(mockOnChange).toHaveBeenCalledWith({
            ...field,
            required: false
        });
    });
});
