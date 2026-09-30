import React from "react";
import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SWRConfig } from "swr";
import UsersPage from "../../resources/js/pages/UsersPage";
import DailyStatsPage from "../../resources/js/pages/DailyStatsPage";
import LoginsPage from "../../resources/js/pages/LoginsPage";
import ChatPage from "../../resources/js/pages/ChatPage";
import LoginLocationsPage from "../../resources/js/pages/LoginLocationsPage";
import AdminPage from "../../resources/js/pages/AdminPage";

const emptyRecords = {
  data: [],
  meta: { current_page: 1, last_page: 1, total: 0, from: null, to: null },
};

it.each([
  ["用户列表", <UsersPage users={emptyRecords} />],
  ["每日统计", <DailyStatsPage dailyStats={emptyRecords} />],
  ["登录记录", <LoginsPage logins={emptyRecords} />],
  ["聊天记录", <ChatPage chatMessages={emptyRecords} isAdmin />],
  ["登录位置", <LoginLocationsPage locations={emptyRecords} isAdmin />],
])(
  "%s opens directly on filters and records without the intro block",
  (title, page) => {
    const { container } = render(<MemoryRouter>{page}</MemoryRouter>);
    expect(container.querySelector(".archive-heading")).toBeNull();
    expect(container.querySelector(".archive-eyebrow")).toBeNull();
    expect(screen.queryByText("SERVER ARCHIVE / 服务器档案")).toBeNull();
    expect(screen.queryByText(/时间按服务器时区/)).toBeNull();
    expect(screen.queryByRole("link", { name: "服务器首页" })).toBeNull();
    expect(screen.getByRole("heading", { name: title }).className).toBe(
      "sr-only",
    );
    expect(screen.getByRole("search")).toBeTruthy();
    expect(screen.getByRole("button", { name: "筛选" })).toBeTruthy();
    expect(screen.getByRole("table", { name: "记录列表" })).toBeTruthy();
  },
);

it("keeps the management overview and destinations without its decorative introduction", () => {
  const { container } = render(
    <MemoryRouter>
      <SWRConfig
        value={{ provider: () => new Map(), revalidateOnMount: false }}
      >
        <AdminPage isAdmin />
      </SWRConfig>
    </MemoryRouter>,
  );
  expect(container.querySelector(".archive-heading")).toBeNull();
  expect(screen.queryByText("ADMIN WORKSPACE")).toBeNull();
  expect(
    screen.queryByText("从玩家活动到聊天档案，快速找到需要的记录"),
  ).toBeNull();
  expect(
    screen.getByRole("heading", { name: "服务器管理控制台" }).className,
  ).toBe("sr-only");
  expect(screen.getByRole("button", { name: "刷新概览" })).toBeTruthy();
  expect(
    screen.getByRole("link", { name: /玩家档案/ }).getAttribute("href"),
  ).toBe("/users");
  expect(
    screen.getByRole("link", { name: /聊天档案/ }).getAttribute("href"),
  ).toBe("/chat");
});
