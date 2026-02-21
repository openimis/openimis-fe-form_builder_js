import * as feCore from '@openimis/fe-core';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as hooks from '../../hooks';
import FormSearcher from '../FormSearcher';

// Mock dependencies
vi.mock('../../hooks', () => ({
    useFormDefinitionsQuery: vi.fn(),
    useFormDefinitionDeleteMutation: vi.fn(),
}));

vi.mock('@openimis/fe-core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useModulesManager: vi.fn(),
        useTranslations: vi.fn(() => ({
            formatMessage: (id, defaultMessage) => defaultMessage || id,
            formatMessageWithValues: (id, values, defaultMessage) => defaultMessage || id,
        })),
        combine: (...fns) => (comp) => comp,
        withHistory: (comp) => comp,
        Searcher: ({ searcherActions, enableActionButtons }) => (
            <div>
                <div data-testid="searcher-mock" />
                {enableActionButtons && searcherActions && searcherActions.map((action, idx) => (
                    <button key={idx} onClick={action.onClick}>
                        {action.label}
                    </button>
                ))}
            </div>
        ),
        historyPush: vi.fn(),
        ConfirmDialog: () => <div data-testid="confirm-dialog-mock" />
    };
});

describe('FormSearcher', () => {
    const mockHistoryPush = feCore.historyPush;

    beforeEach(() => {
        vi.clearAllMocks();

        hooks.useFormDefinitionsQuery.mockReturnValue({
            isLoading: false,
            data: { formDefinitions: [], pageInfo: { totalCount: 0 } },
            error: null,
            refetch: vi.fn(),
        });
        hooks.useFormDefinitionDeleteMutation.mockReturnValue({
            mutate: vi.fn(),
            isLoading: false,
        });

        feCore.useModulesManager.mockReturnValue({});
    });

    it('renders Create button and navigates to builder on click', () => {
        const historyMock = {};
        render(<FormSearcher history={historyMock} />);

        // Assert the create button is rendered
        const createButton = screen.getByRole('button', { name: /Create/i });
        expect(createButton).toBeDefined();

        // Simulate click
        fireEvent.click(createButton);

        // Expect historyPush to be called with formBuilder.new
        expect(mockHistoryPush).toHaveBeenCalledWith(
            expect.anything(), // modulesManager
            historyMock,
            'formBuilder.new'
        );
    });
});
