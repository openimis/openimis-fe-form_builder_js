import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as hooks from '../src/hooks';

// Mock the openimis/fe-core hooks
vi.mock('@openimis/fe-core', () => ({
    useGraphqlQuery: vi.fn(),
    useGraphqlMutation: vi.fn(() => ({ mutate: vi.fn() }))
}));

const LOCAL_STORAGE_KEY = "openimis_form_builder_drafts";

describe('useFormDefinitionsQuery Local Storage Merge', () => {

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('merges local storage forms with backend forms', () => {
        const mockBackendData = {
            formDefinitions: {
                edges: [{ node: { uuid: 'backend-1', name: 'Backend Form' } }],
                totalCount: 1,
                pageInfo: { hasNextPage: false }
            }
        };

        const mockLocalForms = [
            { uuid: 'local-1', name: 'Local Draft' }
        ];

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockLocalForms));

        // Mock useGraphqlQuery to return the fake backend data
        const core = require('@openimis/fe-core');
        core.useGraphqlQuery.mockReturnValue({
            isLoading: false,
            error: null,
            data: mockBackendData,
            refetch: vi.fn()
        });

        // Test the hook
        const { result } = renderHook(() => hooks.useFormDefinitionsQuery({ filters: {} }, {}));

        expect(result.current.data.formDefinitions).toHaveLength(2);
        expect(result.current.data.formDefinitions[0].uuid).toBe('local-1');
        expect(result.current.data.formDefinitions[1].uuid).toBe('backend-1');
        expect(result.current.data.pageInfo.totalCount).toBe(2);
    });

    it('filters merged forms by name correctly', () => {
        const mockBackendData = {
            formDefinitions: {
                edges: [{ node: { uuid: 'backend-1', name: 'Apples' } }],
                totalCount: 1,
            }
        };

        const mockLocalForms = [
            { uuid: 'local-1', name: 'Bananas' },
            { uuid: 'local-2', name: 'Golden Apples' }
        ];

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockLocalForms));

        const core = require('@openimis/fe-core');
        core.useGraphqlQuery.mockReturnValue({
            isLoading: false,
            error: null,
            data: mockBackendData,
            refetch: vi.fn()
        });

        const { result } = renderHook(() => hooks.useFormDefinitionsQuery({ filters: { name_Icontains: 'apple' } }, {}));

        expect(result.current.data.formDefinitions).toHaveLength(2);
        expect(result.current.data.formDefinitions[0].uuid).toBe('local-2'); // Golden Apples
        expect(result.current.data.formDefinitions[1].uuid).toBe('backend-1'); // Apples
    });
});
