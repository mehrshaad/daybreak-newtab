import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsContext } from "../core/settingsContext";
import { addProfile, defaultProfiles } from "../core/profiles";
import ProfileSwitcher from "./ProfileSwitcher";

// The property worth defending here is a negative one: an install with one
// profile must not know this component exists. Most installs are that, and the
// bar should be exactly as it was for them.

function mount({ profiles = defaultProfiles(), activeProfileId = "1" } = {}) {
  const switchProfile = vi.fn();
  const onManage = vi.fn();
  render(
    <SettingsContext.Provider value={{ profiles, activeProfileId, switchProfile }}>
      <ProfileSwitcher onManage={onManage} />
    </SettingsContext.Provider>
  );
  return { switchProfile, onManage };
}

const two = () => addProfile(defaultProfiles(), { name: "Work", emoji: "💼" });

describe("ProfileSwitcher", () => {
  it("renders nothing at all with one profile", () => {
    mount();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("appears once there is somewhere else to go", () => {
    mount({ profiles: two() });
    expect(screen.getByRole("button", { name: /^Profile: Main/ })).toBeTruthy();
  });

  it("names the profile it is on, not merely that profiles exist", () => {
    mount({ profiles: two(), activeProfileId: "2" });
    expect(screen.getByRole("button", { name: /^Profile: Work/ })).toBeTruthy();
  });

  it("falls back to the first profile if the active id names none of them", () => {
    // The device that did not do the deleting. It must show something real
    // rather than an empty chip.
    mount({ profiles: two(), activeProfileId: "9" });
    expect(screen.getByRole("button", { name: /^Profile: Main/ })).toBeTruthy();
  });

  it("switches when another profile is picked", () => {
    const { switchProfile } = mount({ profiles: two() });
    fireEvent.click(screen.getByRole("button", { name: /^Profile: Main/ }));
    const items = within(screen.getByRole("menu")).getAllByRole("menuitemradio");
    fireEvent.click(items[1]);
    expect(switchProfile).toHaveBeenCalledWith("2");
  });

  it("does not switch to the one it is already on", () => {
    const { switchProfile } = mount({ profiles: two() });
    fireEvent.click(screen.getByRole("button", { name: /^Profile: Main/ }));
    const items = within(screen.getByRole("menu")).getAllByRole("menuitemradio");
    fireEvent.click(items[0]);
    // switchProfile is called and refuses the no-op itself; what matters here
    // is that the menu treats it as the current one.
    expect(items[0].getAttribute("aria-checked")).toBe("true");
    expect(items[1].getAttribute("aria-checked")).toBe("false");
  });

  it("sends managing to settings rather than doing it in the menu", () => {
    const { onManage } = mount({ profiles: two() });
    fireEvent.click(screen.getByRole("button", { name: /^Profile: Main/ }));
    fireEvent.click(within(screen.getByRole("menu")).getByRole("menuitem"));
    expect(onManage).toHaveBeenCalled();
  });

  it("lets the arrows reach the manage row, not just the profiles", () => {
    // The default roving selector only matches radios, so with two profiles the
    // last row in the menu would have been mouse-only.
    mount({ profiles: two() });
    fireEvent.click(screen.getByRole("button", { name: /^Profile: Main/ }));
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "End" });
    expect(document.activeElement.getAttribute("role")).toBe("menuitem");
  });

  it("closes on Escape", () => {
    mount({ profiles: two() });
    fireEvent.click(screen.getByRole("button", { name: /^Profile: Main/ }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
