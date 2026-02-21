
import * as feCore from '@openimis/fe-core';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as hooks from '../../../hooks';
import FormDesigner from '../index';

// Mock dependencies
vi.mock('../../../hooks', () => ({
    useFormDefinitionQuery: vi.fn(),
    useFormDefinitionCreateMutation: vi.fn(),
    useFormDefinitionUpdateMutation: vi.fn(),
}));

vi.mock('@openimis/fe-core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useModulesManager: vi.fn(),
        useTranslations: vi.fn(() => ({
            formatMessage: ({ id }) => id,
        })),
        combine: (...fns) => (comp) => comp, // Simplify enhance
        withModulesManager: (comp) => comp,
        withHistory: (comp) => comp,
        TextInput: ({ label, onChange, value }) => (
            <label>
                {label}
                <input
                    aria-label={label}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </label>
        ),
        historyPush: vi.fn(),
    };
});

vi.mock('react-router-dom', () => ({
    useParams: vi.fn(),
    useHistory: vi.fn(),
}));

describe('FormDesigner', () => {
    const mockMutate = vi.fn();
    const mockHistoryPush = feCore.historyPush;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock hooks
        hooks.useFormDefinitionQuery.mockReturnValue({
            isLoading: false,
            data: null,
            error: null,
        });
        hooks.useFormDefinitionCreateMutation.mockReturnValue({
            mutate: mockMutate,
            isLoading: false,
        });
        hooks.useFormDefinitionUpdateMutation.mockReturnValue({
            mutate: mockMutate,
            isLoading: false,
        });

        // Mock fe-core hooks
        feCore.useModulesManager.mockReturnValue({});

        // Mock useParams
        const { useParams } = require('react-router-dom');
        useParams.mockReturnValue({});
    });

    it('renders create form correctly', () => {
        render(<FormDesigner history={{}} match={{ params: {} }} />);
        expect(screen.getByLabelText('name')).toBeInTheDocument();
        expect(screen.getByLabelText('save')).toBeInTheDocument();
    });

    it('calls create mutation on save', async () => {
        render(<FormDesigner history={{}} match={{ params: {} }} />);

        // Fill name
        const nameInput = screen.getByLabelText('name');
        fireEvent.change(nameInput, { target: { value: 'Test Form' } });

        // Click save
        const saveButton = screen.getByLabelText('save');
        fireEvent.click(saveButton);

        expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Test Form',
                formType: 'standalone',
            }),
            expect.any(Object) // options
        );
    });
});
