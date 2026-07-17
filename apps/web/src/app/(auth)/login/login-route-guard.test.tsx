import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CodePage from "./code/page";
import LoginPage from "./page";

vi.mock("~/app/_components/brand/logo", () => ({
  default: () => <div data-testid="logo" />,
}));

vi.mock("./_components/login-form", () => ({
  EmailForm: () => <form data-testid="email-form" />,
  OtpForm: () => <form data-testid="otp-form" />,
}));

vi.mock("./_components/session-check", () => ({
  default: () => <div data-testid="session-check" />,
}));

describe("login session guard", () => {
  it("redirects existing sessions away from the login entry page", () => {
    render(<LoginPage />);

    expect(screen.getByTestId("session-check")).toBeInTheDocument();
  });

  it("does not compete with OTP verification on the code page", async () => {
    const page = await CodePage({
      searchParams: Promise.resolve({ email: "sailor@example.com" }),
    });

    render(page);

    expect(screen.queryByTestId("session-check")).not.toBeInTheDocument();
    expect(screen.getByTestId("otp-form")).toBeInTheDocument();
  });
});
