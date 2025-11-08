import React from 'react';
import { render, screen } from '@testing-library/react';
import { RuleNode, ManualTaskNode } from './CustomNodes';

// Mock reactflow
jest.mock('reactflow', () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: 'top', Bottom: 'bottom' }
}));

describe('CustomNodes', () => {
  describe('RuleNode', () => {
    it('should render Rule node with default label', () => {
      render(<RuleNode data={{}} />);
      expect(screen.getByText('Rule')).toBeInTheDocument();
      expect(screen.getByText('Unnamed Rule')).toBeInTheDocument();
    });

    it('should render Rule node with custom label', () => {
      render(<RuleNode data={{ label: 'Amount Check' }} />);
      expect(screen.getByText('Rule')).toBeInTheDocument();
      expect(screen.getByText('Amount Check')).toBeInTheDocument();
    });

    it('should render handles', () => {
      const { container } = render(<RuleNode data={{ label: 'Test' }} />);
      const handles = container.querySelectorAll('[data-testid="handle"]');
      expect(handles.length).toBe(2); // Top and Bottom handles
    });
  });

  describe('ManualTaskNode', () => {
    it('should render Manual Task node with default label', () => {
      render(<ManualTaskNode data={{}} />);
      expect(screen.getByText('Manual Task')).toBeInTheDocument();
      expect(screen.getByText('Unnamed Task')).toBeInTheDocument();
    });

    it('should render Manual Task node with custom label', () => {
      render(<ManualTaskNode data={{ label: 'Review Documents' }} />);
      expect(screen.getByText('Manual Task')).toBeInTheDocument();
      expect(screen.getByText('Review Documents')).toBeInTheDocument();
    });

    it('should render handles', () => {
      const { container } = render(<ManualTaskNode data={{ label: 'Test' }} />);
      const handles = container.querySelectorAll('[data-testid="handle"]');
      expect(handles.length).toBe(2); // Top and Bottom handles
    });
  });
});
