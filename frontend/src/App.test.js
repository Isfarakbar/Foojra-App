import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Foojra app', () => {
  render(<App />);
  const foojraElement = screen.getAllByText(/foojra/i)[0];
  expect(foojraElement).toBeInTheDocument();
});
