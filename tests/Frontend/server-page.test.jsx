import React from "react";
import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SWRConfig } from "swr";
import { ThemeProvider } from "../../resources/js/contexts/ThemeContext";
import Nav from "../../resources/js/components/Nav";
import ServerStatusPage from "../../resources/js/pages/ServerStatusPage";

function renderServer(players = []) {
  localStorage.setItem("theme", "dark");
  const serverStatus = {
    is_online: true,
    query_available: true,
    players,
    online_players: players.length,
    max_players: 20,
    version: "1.21",
    display_name: "测试服务器",
    ping_latency_ms: 10,
    timer: "0.01",
    errors: [],
  };
  return render(
    <MemoryRouter>
      <SWRConfig
        value={{ provider: () => new Map(), revalidateOnMount: false }}
      >
        <ThemeProvider>
          <Nav isAdmin />
          <ServerStatusPage serverStatus={serverStatus} receivedAt={1} />
        </ThemeProvider>
      </SWRConfig>
    </MemoryRouter>,
  );
}

it("keeps the sky moon/sun switch working without a duplicate navigation toggle", async () => {
  const user = userEvent.setup();
  renderServer();
  expect(screen.queryByRole("button", { name: "切换为日间模式" })).toBeNull();
  expect(screen.queryByRole("button", { name: "切换为夜间模式" })).toBeNull();
  expect(screen.getAllByRole("button", { name: /切换到/ })).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "切换到白天主题" }));
  expect(document.documentElement.classList.contains("light")).toBe(true);
  await user.click(screen.getByRole("button", { name: "切换到夜晚主题" }));
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

it("shows each online player on the grass only, with no standalone player panel", () => {
  const { container } = renderServer(["Alex", "Steve"]);
  expect(container.querySelector(".mc-ground")).not.toBeNull();
  const characters = container.querySelectorAll(
    ".mc-standing-players .mc-standing-player",
  );
  expect([...characters].map((image) => image.alt)).toEqual([
    "Alex 的 Minecraft 角色",
    "Steve 的 Minecraft 角色",
  ]);
  expect(container.querySelector(".mc-player-section")).toBeNull();
  expect(container.querySelector(".mc-player-grid")).toBeNull();
  expect(screen.queryByText("在线冒险家")).toBeNull();
  expect(screen.getByRole("button", { name: "刷新状态" })).toBeTruthy();
});

it("keeps empty grass without adding an empty player-list panel", () => {
  const { container } = renderServer();
  expect(container.querySelector(".mc-ground")).not.toBeNull();
  expect(container.querySelector(".mc-standing-players")).toBeNull();
  expect(screen.queryByText(/暂时没有在线冒险家/)).toBeNull();
  expect(container.querySelector(".mc-player-section")).toBeNull();
});
