import { render, screen } from "@testing-library/react";
import App from "./App";
import { useAuth } from "./contexts/AuthContext";

jest.mock("./contexts/AuthContext");

test("renders posts showcase", () => {
  useAuth.mockReturnValue({
    user: { email: "test@example.com" },
    loading: false,
    isAdmin: () => false,
  });

  render(<App />);
  const linkElement = screen.getByText(/Posts Showcase/i);
  expect(linkElement).toBeInTheDocument();
});
